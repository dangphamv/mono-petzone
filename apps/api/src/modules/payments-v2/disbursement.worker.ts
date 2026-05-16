import { Injectable, Inject, Logger, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { OUTBOX_V2_COLUMNS } from '../../common/constants/columns';
import { PAYMENT_PROVIDER, type PaymentProvider } from './psp/psp.interface';
import { PaymentsV2Service } from './payments-v2.service';

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;

interface OutboxRow {
  id: string;
  payment_v2_id: string;
  payout_v2_id: string | null;
  kind: 'disburse_provider' | 'disburse_petzone' | 'refund';
  payload: {
    amount: number;
    recipient: { bank_name: string; account_number: string; account_holder: string };
    description: string;
  };
  attempts: number;
  scheduled_at: string;
}

/**
 * Drains psp_outbox_v2 every 30 seconds. At-least-once delivery: each row is
 * pinned to a single dispatch attempt within a tick. Failures bump `attempts`
 * + record `last_error`; rows that exhaust MAX_ATTEMPTS go to status=failed
 * for admin to retry.
 */
@Injectable()
export class DisbursementWorker {
  private readonly logger = new Logger(DisbursementWorker.name);
  private running = false;

  constructor(
    private readonly supabase: SupabaseService,
    @Inject(PAYMENT_PROVIDER) private readonly psp: PaymentProvider,
    @Inject(forwardRef(() => PaymentsV2Service))
    private readonly v2: PaymentsV2Service,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async drain() {
    if (this.running) return;
    // Bail nếu admin tắt v2 — tránh query psp_outbox_v2 lung tung khi
    // bảng chưa migrate hoặc v2 chỉ đang setup
    if (!(await this.v2.isEnabled())) return;
    this.running = true;
    try {
      const db = this.supabase.client as unknown as { from: (t: string) => any };
      const { data: rows } = await db
        .from('psp_outbox_v2')
        .select(OUTBOX_V2_COLUMNS)
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(BATCH_SIZE);

      if (!rows?.length) return;

      for (const row of rows as OutboxRow[]) {
        await this.dispatch(row);
      }
    } catch (err) {
      this.logger.error(`drain failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async dispatch(row: OutboxRow) {
    const db = this.supabase.client as unknown as { from: (t: string) => any };
    const { data: claimed, error: claimErr } = await db
      .from('psp_outbox_v2')
      .update({ status: 'dispatched', dispatched_at: new Date().toISOString(), attempts: row.attempts + 1 })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (claimErr || !claimed) return;

    try {
      if (row.kind === 'disburse_provider' || row.kind === 'disburse_petzone') {
        const result = await this.psp.disburse({
          idempotency_key: row.id,
          amount: row.payload.amount,
          currency: 'VND',
          recipient: row.payload.recipient,
          description: row.payload.description,
        });
        await db
          .from('provider_payouts_v2')
          .update({ psp_disbursement_id: result.psp_disbursement_id, status: 'dispatched', updated_at: new Date().toISOString() })
          .eq('id', row.payout_v2_id);
        await db
          .from('psp_outbox_v2')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', row.id);
      }
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`dispatch row ${row.id} failed: ${msg}`);
      const exhausted = row.attempts + 1 >= MAX_ATTEMPTS;
      await db
        .from('psp_outbox_v2')
        .update({
          status: exhausted ? 'failed' : 'pending',
          last_error: msg,
          scheduled_at: exhausted ? row.scheduled_at : new Date(Date.now() + 60_000 * Math.pow(2, row.attempts)).toISOString(),
        })
        .eq('id', row.id);
      if (exhausted && row.payout_v2_id) {
        await db
          .from('provider_payouts_v2')
          .update({ status: 'failed', failure_reason: msg, updated_at: new Date().toISOString() })
          .eq('id', row.payout_v2_id);
        await db
          .from('payments_v2')
          .update({ status: 'split_failed', updated_at: new Date().toISOString() })
          .eq('id', row.payment_v2_id);
      }
    }
  }
}
