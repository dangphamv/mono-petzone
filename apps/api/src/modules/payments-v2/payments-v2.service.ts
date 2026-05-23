import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { COMMISSION_RATE, NOTIFICATION_EVENTS } from '@petzone/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { ORDER_COLUMNS, PAYMENT_V2_COLUMNS, PAYOUT_V2_COLUMNS } from '../../common/constants/columns';
import { PAYMENT_PROVIDER, type PaymentProvider, type ParsedWebhookEvent } from './psp/psp.interface';
import type { InitiatePaymentV2Input, RefundV2Input } from '@petzone/validators';
import type { BankAccountSnapshot, PaymentV2, PaymentV2Status, PayoutV2Recipient } from '@petzone/shared';

interface OrderRow {
  id: string;
  order_number: string | null;
  owner_id: string;
  provider_id: string;
  status: string;
  total_price: number | string;
  payment_version: number;
}

interface ProviderBankRow {
  id: string;
  user_id: string;
  bank_name: string | null;
  bank_account_number_encrypted: string | null;
  bank_account_holder: string | null;
  bank_verified_at: string | null;
}

interface PayoutV2Row {
  id: string;
  payment_v2_id: string;
  recipient: PayoutV2Recipient;
  net_amount: number;
  status: string;
}

@Injectable()
export class PaymentsV2Service {
  private readonly logger = new Logger(PaymentsV2Service.name);

  // 60-second cache for the v2 enabled flag — avoids hitting app_config
  // on every cron tick / event fire. Admin toggle takes effect within 60s.
  private enabledCache: { value: boolean; expiresAt: number } | null = null;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly events: EventEmitter2,
    @Inject(PAYMENT_PROVIDER) private readonly psp: PaymentProvider,
  ) {}

  /**
   * Read `app_config.payments_v2_enabled` with 60s cache.
   * Workers + listeners call this to bail early when v2 is disabled,
   * avoiding unnecessary DB queries + log noise on tables that may not
   * even exist yet (e.g. before migrations are applied).
   */
  async isEnabled(): Promise<boolean> {
    const now = Date.now();
    if (this.enabledCache && this.enabledCache.expiresAt > now) {
      return this.enabledCache.value;
    }
    let enabled = false;
    try {
      const { data } = await this.supabase.client
        .from('app_config')
        .select('value')
        .eq('key', 'payments_v2_enabled')
        .maybeSingle();
      const v = (data as { value: unknown } | null)?.value;
      if (typeof v === 'boolean') enabled = v;
      else if (typeof v === 'string') enabled = v === 'true' || v === '1';
      else enabled = Boolean(v);
    } catch {
      // app_config table missing / network fail → treat as disabled (safe default)
      enabled = false;
    }
    this.enabledCache = { value: enabled, expiresAt: now + 60_000 };
    return enabled;
  }

  // Supabase-js requires generated Database typings to infer select shapes.
  // payments_v2 et al. are new tables not yet in the generated types — cast
  // to `any` at the chain root so the calls compile. Hand-rolled row interfaces
  // (PaymentV2 in @petzone/shared, OrderRow above) keep call-site type safety.
  private get db() {
    return this.supabase.client as unknown as {
      from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  }

  async initiate(userId: string, body: InitiatePaymentV2Input) {
    const { data: orderData, error: orderErr } = await this.db
      .from('orders')
      .select(ORDER_COLUMNS + ', payment_version')
      .eq('id', body.order_id)
      .single();
    const order = orderData as OrderRow | null;
    if (orderErr || !order) throw new NotFoundException('Order not found');
    if (order.owner_id !== userId) throw new ForbiddenException('Not the order owner');
    if (order.payment_version !== 2) throw new BadRequestException('Order is not v2; use /api/payments');
    if (order.status !== 'pending_payment') throw new BadRequestException('Order is not in payable status');

    // Idempotency — if a payments_v2 row already exists for this order, return it.
    const { data: existingData } = await this.db
      .from('payments_v2')
      .select(PAYMENT_V2_COLUMNS)
      .eq('order_id', body.order_id)
      .maybeSingle();
    const existing = existingData as PaymentV2 | null;
    if (existing && existing.status === 'awaiting_payment') {
      return { payment: existing, payment_url: existing.psp_payment_url };
    }
    if (existing) throw new BadRequestException(`Payment already in status ${existing.status}`);

    const psp = await this.psp.initiatePayment({
      order_id: order.id,
      amount: Number(order.total_price),
      currency: 'VND',
      method: body.method,
      return_url: body.return_url,
      description: `PetZone order ${order.order_number ?? order.id}`,
    });

    const { data: payment, error: payErr } = await this.db
      .from('payments_v2')
      .insert({
        order_id: order.id,
        owner_id: order.owner_id,
        provider_id: order.provider_id,
        amount: order.total_price,
        currency: 'VND',
        psp_provider: this.psp.name,
        psp_order_id: psp.psp_order_id,
        psp_payment_url: psp.payment_url,
        method: body.method,
        status: 'awaiting_payment',
      })
      .select(PAYMENT_V2_COLUMNS)
      .single();
    if (payErr) throw new BadRequestException(payErr.message);

    return { payment: payment as PaymentV2, payment_url: psp.payment_url };
  }

  async handleWebhook(kind: 'collection' | 'disbursement' | 'refund', rawBody: string, headers: Record<string, string>) {
    const sigValid = this.psp.verifyWebhookSignature(rawBody, headers);
    let event: ParsedWebhookEvent | null = null;
    let parseError: string | null = null;
    try {
      event = this.psp.parseWebhook(rawBody, headers, kind);
    } catch (err) {
      parseError = (err as Error).message;
    }

    await this.db.from('psp_webhook_log').insert({
      psp_provider: this.psp.name,
      kind,
      raw_body: rawBody,
      headers,
      signature_valid: sigValid,
      psp_event_id: event?.event_id ?? null,
      processed_at: null,
    });

    if (!sigValid) {
      this.logger.warn(`[psp-webhook] invalid signature kind=${kind}`);
      return { ok: false, reason: 'invalid_signature' };
    }
    if (!event) {
      this.logger.error(`[psp-webhook] parse failed: ${parseError}`);
      return { ok: false, reason: 'parse_failed' };
    }

    // Idempotency check
    if (event.event_id) {
      const { count } = await this.db
        .from('psp_webhook_log')
        .select('id', { count: 'exact', head: true })
        .eq('psp_provider', this.psp.name)
        .eq('psp_event_id', event.event_id)
        .not('processed_at', 'is', null);
      if (count && count > 0) return { ok: true, idempotent: true };
    }

    if (kind === 'collection') await this.handleCollection(event);
    else if (kind === 'disbursement') await this.handleDisbursement(event);
    else if (kind === 'refund') await this.handleRefund(event);

    await this.db
      .from('psp_webhook_log')
      .update({ processed_at: new Date().toISOString() })
      .eq('psp_provider', this.psp.name)
      .eq('psp_event_id', event.event_id);

    return { ok: true };
  }

  private async handleCollection(event: ParsedWebhookEvent) {
    if (!event.psp_order_id) {
      this.logger.warn('[psp-webhook] collection missing psp_order_id');
      return;
    }
    const { data } = await this.db
      .from('payments_v2')
      .select(PAYMENT_V2_COLUMNS)
      .eq('psp_order_id', event.psp_order_id)
      .single();
    const payment = data as PaymentV2 | null;
    if (!payment) {
      this.logger.warn(`[psp-webhook] collection unknown psp_order_id=${event.psp_order_id}`);
      return;
    }
    if (payment.status !== 'awaiting_payment') return;

    if (event.status !== 'success') {
      this.logger.warn(`[psp-webhook] collection failed for ${event.psp_order_id}: ${event.failure_reason}`);
      return;
    }

    const now = new Date().toISOString();
    await this.db
      .from('payments_v2')
      .update({ status: 'captured', captured_at: now, method: event.method ?? payment.method, updated_at: now })
      .eq('id', payment.id);

    await this.db.from('escrow_ledger_v2').insert({
      payment_v2_id: payment.id,
      type: 'hold',
      amount: payment.amount,
      balance_after: payment.amount,
      psp_reference: event.event_id,
      description: 'PSP capture confirmed',
    });

    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    await this.db
      .from('orders')
      .update({ status: 'pending', provider_response_deadline: deadline, updated_at: now })
      .eq('id', payment.order_id);

    await this.db.from('order_status_history').insert({
      order_id: payment.order_id,
      status: 'pending',
      actor_id: payment.owner_id,
      actor_type: 'system',
      note: `v2 payment captured at PSP (${this.psp.name}). Awaiting provider confirmation.`,
    });

    // Notify owner (receipt) + provider (new paid order to confirm/decline).
    // Reuses the same PAYMENT_COMPLETED handler as the v1 online flow.
    const { data: orderRow } = await this.db
      .from('orders')
      .select('order_number, providers(user_id)')
      .eq('id', payment.order_id)
      .single();
    const providerInner = Array.isArray(orderRow?.providers) ? orderRow.providers[0] : orderRow?.providers;

    this.events.emit(NOTIFICATION_EVENTS.PAYMENT_COMPLETED, {
      owner_id: payment.owner_id,
      provider_user_id: providerInner?.user_id,
      order_id: payment.order_id,
      order_number: orderRow?.order_number ?? '',
      amount: Number(payment.amount),
      gateway: this.psp.name,
    });
  }

  private async handleDisbursement(event: ParsedWebhookEvent) {
    if (!event.psp_disbursement_id) return;
    const { data } = await this.db
      .from('provider_payouts_v2')
      .select(PAYOUT_V2_COLUMNS)
      .eq('psp_disbursement_id', event.psp_disbursement_id)
      .single();
    const payout = data as (PayoutV2Row & { recipient: PayoutV2Recipient }) | null;
    if (!payout) {
      this.logger.warn(`[psp-webhook] disbursement unknown id=${event.psp_disbursement_id}`);
      return;
    }
    if (payout.status === 'completed' || payout.status === 'failed') return;

    const now = new Date().toISOString();
    if (event.status === 'success') {
      await this.db
        .from('provider_payouts_v2')
        .update({ status: 'completed', completed_at: now, updated_at: now })
        .eq('id', payout.id);
      await this.db.from('escrow_ledger_v2').insert({
        payment_v2_id: payout.payment_v2_id,
        type: 'release',
        amount: payout.net_amount,
        balance_after: 0,
        psp_reference: event.event_id,
        description: `Disbursement to ${payout.recipient}`,
      });
      await this.maybeFinalizeSplit(payout.payment_v2_id);
    } else {
      await this.db
        .from('provider_payouts_v2')
        .update({ status: 'failed', failure_reason: event.failure_reason ?? 'PSP reported failure', updated_at: now })
        .eq('id', payout.id);
      await this.db
        .from('payments_v2')
        .update({ status: 'split_failed', updated_at: now })
        .eq('id', payout.payment_v2_id);
    }
  }

  private async handleRefund(event: ParsedWebhookEvent) {
    if (!event.psp_order_id) return;
    const { data } = await this.db
      .from('payments_v2')
      .select(PAYMENT_V2_COLUMNS)
      .eq('psp_order_id', event.psp_order_id)
      .single();
    const payment = data as PaymentV2 | null;
    if (!payment) return;
    if (event.status !== 'success') {
      this.logger.warn(`[psp-webhook] refund failed for ${event.psp_order_id}`);
      return;
    }
    const now = new Date().toISOString();
    await this.db
      .from('payments_v2')
      .update({ status: 'refunded', updated_at: now })
      .eq('id', payment.id);
    await this.db.from('escrow_ledger_v2').insert({
      payment_v2_id: payment.id,
      type: 'refund',
      amount: event.amount ?? payment.amount,
      balance_after: 0,
      psp_reference: event.event_id,
      description: 'PSP refund settled',
    });
  }

  private async maybeFinalizeSplit(paymentV2Id: string) {
    const { data: legs } = await this.db
      .from('provider_payouts_v2')
      .select('status')
      .eq('payment_v2_id', paymentV2Id);
    if (!legs?.length) return;
    const allDone = (legs as { status: string }[]).every((l) => l.status === 'completed');
    if (!allDone) return;
    const now = new Date().toISOString();
    await this.db
      .from('payments_v2')
      .update({ status: 'split_completed', split_completed_at: now, updated_at: now })
      .eq('id', paymentV2Id);
  }

  /**
   * Called by payment.listener on `order.v2.completed`. Writes the two outbox
   * rows + flips payment to split_pending. Idempotent — if outbox rows already
   * exist for this payment, no-ops.
   */
  async enqueueSplit(orderId: string) {
    const { data: paymentRow } = await this.db
      .from('payments_v2')
      .select(PAYMENT_V2_COLUMNS)
      .eq('order_id', orderId)
      .single();
    const payment = paymentRow as PaymentV2 | null;
    if (!payment) {
      this.logger.warn(`[enqueueSplit] no v2 payment for order ${orderId}`);
      return;
    }
    if (payment.status !== 'captured') {
      this.logger.warn(`[enqueueSplit] payment ${payment.id} not in captured (got ${payment.status})`);
      return;
    }

    const { count } = await this.db
      .from('psp_outbox_v2')
      .select('id', { count: 'exact', head: true })
      .eq('payment_v2_id', payment.id);
    if (count && count > 0) return;

    const { data: providerRow } = await this.db
      .from('providers')
      .select('id, user_id, bank_name, bank_account_number_encrypted, bank_account_holder, bank_verified_at')
      .eq('id', payment.provider_id)
      .single();
    const provider = providerRow as ProviderBankRow | null;
    if (!provider?.bank_name || !provider.bank_account_number_encrypted || !provider.bank_account_holder || !provider.bank_verified_at) {
      this.logger.error(`[enqueueSplit] provider ${payment.provider_id} missing/unverified bank info`);
      await this.db
        .from('payments_v2')
        .update({ status: 'split_failed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
      return;
    }

    const gross = Number(payment.amount);
    const commission = Math.round(gross * COMMISSION_RATE);
    const providerNet = gross - commission;

    const providerSnapshot: BankAccountSnapshot = {
      bank_name: provider.bank_name,
      account_number_masked: this.maskAccount(this.decryptAccount(provider.bank_account_number_encrypted)),
      account_holder: provider.bank_account_holder,
    };

    const petzoneAccount = {
      bank_name: process.env.NINEPAY_PETZONE_BANK_NAME ?? '',
      account_number: process.env.NINEPAY_PETZONE_ACCOUNT_NUMBER ?? '',
      account_holder: process.env.NINEPAY_PETZONE_ACCOUNT_HOLDER ?? 'PetZone',
    };
    const petzoneSnapshot: BankAccountSnapshot = {
      bank_name: petzoneAccount.bank_name,
      account_number_masked: this.maskAccount(petzoneAccount.account_number),
      account_holder: petzoneAccount.account_holder,
    };

    const { data: payouts, error: payoutErr } = await this.db
      .from('provider_payouts_v2')
      .insert([
        {
          payment_v2_id: payment.id,
          provider_id: payment.provider_id,
          recipient: 'provider',
          gross_amount: gross,
          commission_rate: COMMISSION_RATE,
          commission_amount: commission,
          net_amount: providerNet,
          bank_account_snapshot: providerSnapshot,
          status: 'pending',
        },
        {
          payment_v2_id: payment.id,
          provider_id: payment.provider_id,
          recipient: 'petzone',
          gross_amount: gross,
          commission_rate: COMMISSION_RATE,
          commission_amount: commission,
          net_amount: commission,
          bank_account_snapshot: petzoneSnapshot,
          status: 'pending',
        },
      ])
      .select(PAYOUT_V2_COLUMNS);
    if (payoutErr || !payouts) {
      throw new ServiceUnavailableException(payoutErr?.message ?? 'Failed to create payouts');
    }

    const outboxRows = (payouts as PayoutV2Row[]).map((p) => ({
      payment_v2_id: payment.id,
      payout_v2_id: p.id,
      kind: p.recipient === 'provider' ? 'disburse_provider' : 'disburse_petzone',
      payload: {
        amount: p.net_amount,
        recipient: p.recipient === 'provider'
          ? { bank_name: provider.bank_name, account_number: this.decryptAccount(provider.bank_account_number_encrypted!), account_holder: provider.bank_account_holder }
          : petzoneAccount,
        description: `PetZone order ${orderId} ${p.recipient} payout`,
      },
      status: 'pending',
    }));
    await this.db.from('psp_outbox_v2').insert(outboxRows);

    await this.db
      .from('payments_v2')
      .update({ status: 'split_pending', updated_at: new Date().toISOString() })
      .eq('id', payment.id);
  }

  async refund(userId: string, orderId: string, body: RefundV2Input) {
    const { data } = await this.db
      .from('payments_v2')
      .select(PAYMENT_V2_COLUMNS)
      .eq('order_id', orderId)
      .single();
    const payment = data as PaymentV2 | null;
    if (!payment) throw new NotFoundException('v2 payment not found');
    if (payment.owner_id !== userId) {
      throw new ForbiddenException('Not the order owner');
    }
    if (!(['captured', 'split_failed'] as PaymentV2Status[]).includes(payment.status)) {
      throw new BadRequestException(`Cannot refund payment in status ${payment.status}`);
    }
    if (body.amount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount exceeds captured amount');
    }
    const result = await this.psp.refund({
      psp_order_id: payment.psp_order_id,
      amount: body.amount,
      reason: body.reason,
      idempotency_key: `refund-${payment.id}-${Date.now()}`,
    });
    return { psp_refund_id: result.psp_refund_id, status: 'pending_settlement' };
  }

  async findByOrder(userId: string, orderId: string) {
    const { data } = await this.db
      .from('payments_v2')
      .select(PAYMENT_V2_COLUMNS)
      .eq('order_id', orderId)
      .maybeSingle();
    const payment = data as PaymentV2 | null;
    if (!payment) throw new NotFoundException('v2 payment not found');
    const isOwner = payment.owner_id === userId;
    if (!isOwner) {
      const { data: provider } = await this.db
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();
      if ((provider as { id: string } | null)?.id !== payment.provider_id) throw new ForbiddenException('No access');
    }
    return payment;
  }

  // App-layer encryption is a stub — real impl should use Supabase Vault (pgsodium)
  // or a KMS-backed envelope. Kept as identity here so the bank_account_number_encrypted
  // column wires through end-to-end without TODO scaffolding.
  private decryptAccount(stored: string): string {
    return stored;
  }

  private maskAccount(num: string): string {
    if (num.length <= 4) return num;
    return `****${num.slice(-4)}`;
  }
}
