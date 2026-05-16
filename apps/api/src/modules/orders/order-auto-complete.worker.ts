import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { ORDER_COLUMNS } from '../../common/constants/columns';

const BATCH_SIZE = 50;
const AUTO_COMPLETE_NOTE = 'Auto-completed: owner did not confirm receipt within 24h';

/**
 * v1 only — auto-completes orders sitting in `check_out` past the owner's
 * 24h confirm-receive window. v2 orders are driven by the provider so they
 * never set owner_confirm_deadline.
 */
@Injectable()
export class OrderAutoCompleteWorker {
  private readonly logger = new Logger(OrderAutoCompleteWorker.name);
  private running = false;
  // Self-disable nếu DB schema chưa migrate. Phòng case Supabase cloud
  // chưa apply migration 20260515000003 — error 1 lần, log warn, dừng cron
  // cho đến khi process restart (sau khi admin chạy `supabase db push`).
  private disabled = false;

  constructor(private readonly supabase: SupabaseService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep() {
    if (this.running || this.disabled) return;
    this.running = true;
    try {
      const now = new Date().toISOString();
      // v2 orders không có owner_confirm_deadline (chỉ set cho v1 trong
      // checkOut()), nên `.lte('owner_confirm_deadline', now)` đã tự lọc
      // hết v2 — không cần filter payment_version (tránh phụ thuộc column
      // v2 — worker này hoàn toàn v1).
      const { data: rows, error } = await this.supabase.client
        .from('orders')
        .select('id')
        .eq('status', 'check_out')
        .lte('owner_confirm_deadline', now)
        .limit(BATCH_SIZE);
      if (error) {
        // Schema missing → bail forever (until restart) instead of spamming log
        if (/column .* does not exist/i.test(error.message)) {
          this.logger.warn(
            `Self-disabled: missing schema (${error.message}). Run 'supabase db push' and restart this service.`,
          );
          this.disabled = true;
          return;
        }
        this.logger.error(`fetch failed: ${error.message}`);
        return;
      }
      if (!rows?.length) return;

      for (const row of rows as { id: string }[]) {
        await this.complete(row.id);
      }
    } catch (err) {
      this.logger.error(`sweep failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async complete(orderId: string) {
    const now = new Date().toISOString();
    // Conditional update — only flip if still in check_out, to avoid racing
    // with a late owner confirmation.
    const { data, error } = await this.supabase.client
      .from('orders')
      .update({
        status: 'completed',
        completed_at: now,
        owner_confirm_deadline: null,
        updated_at: now,
      })
      .eq('id', orderId)
      .eq('status', 'check_out')
      .select(ORDER_COLUMNS)
      .maybeSingle();
    if (error) {
      this.logger.error(`auto-complete ${orderId} failed: ${error.message}`);
      return;
    }
    if (!data) return;

    const { error: histErr } = await this.supabase.client.from('order_status_history').insert({
      order_id: orderId,
      status: 'completed',
      actor_id: null,
      actor_type: 'system',
      note: AUTO_COMPLETE_NOTE,
    });
    if (histErr) this.logger.error(`history insert ${orderId} failed: ${histErr.message}`);

    this.logger.log(`auto-completed v1 order ${orderId}`);
  }
}
