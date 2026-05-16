import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseService } from '../supabase/supabase.service';
import { COMMISSION_RATE } from '@petzone/shared';
import { PAYMENT_COLUMNS, ORDER_COLUMNS, PAYOUT_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';
import { randomUUID } from 'crypto';
import type { CreatePaymentInput, RefundInput } from '@petzone/validators';
import { GatewayRegistry } from './gateways/gateway.registry';
import type { PaymentGateway, WebhookKind } from './gateways/gateway.interface';

export interface PaymentRow {
  id: string;
  order_id: string;
  method: string;
  amount: number | string;
  status: string;
  transaction_ref?: string | null;
  refund_amount?: number | string | null;
  gateway_response?: Record<string, unknown> | null;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly gateways: GatewayRegistry,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, body: CreatePaymentInput) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('id', body.order_id)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');
    if (order.owner_id !== userId) throw new ForbiddenException('Not the order owner');
    if (order.status !== 'pending_payment')
      throw new BadRequestException('Order is not in payable status');

    // Per-method enable flag (app_config). Allows admin to kill-switch a
    // method from the dashboard without redeploy.
    if (!(await this.isGatewayEnabled(body.method))) {
      throw new BadRequestException(`Payment method '${body.method}' is temporarily disabled`);
    }

    if (body.method === 'cash') return this.createCash(userId, body, order);

    const gateway = this.gateways.get(body.method);
    if (!gateway) return this.createManual(userId, body, order);

    return this.createViaGateway(userId, body, order, gateway);
  }

  /**
   * Cash-on-checkin flow. Owner picks "trả tiền mặt" at booking — no online
   * step required, no gateway involved. We flip the order straight from
   * pending_payment to pending (provider's queue) and rely on the provider
   * to confirm cash receipt later via POST /payments/:id/confirm-cash.
   *
   * Risk: owner could no-show. Acceptable for 0% commission trial; provider
   * can decline the order if they're nervous, or cancel before check-in.
   */
  private async createCash(
    _userId: string,
    body: CreatePaymentInput,
    order: {
      id: string;
      owner_id: string;
      order_number?: string | null;
      provider_id: string;
      total_price: number | string;
    },
  ) {
    const { data: inserted, error: payErr } = await this.supabase.client
      .from('payments')
      .insert({
        order_id: body.order_id,
        method: 'cash',
        amount: order.total_price,
        status: 'pending',
        transaction_ref: `CASH-${order.order_number ?? order.id}`,
      })
      .select(PAYMENT_COLUMNS)
      .single();
    if (payErr) throw new BadRequestException(payErr.message);
    const payment = inserted as PaymentRow;

    // Skip the pending_payment → online → pending dance. Order goes
    // straight to "awaiting provider acceptance" — provider sees it and
    // accepts/declines, then collects cash at check-in.
    const now = new Date().toISOString();
    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    await this.supabase.client
      .from('orders')
      .update({ status: 'pending', provider_response_deadline: deadline, updated_at: now })
      .eq('id', order.id)
      .eq('status', 'pending_payment');

    await this.supabase.client.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending',
      actor_id: null,
      actor_type: 'system',
      note: 'Cash-on-checkin order — awaiting provider acceptance. Cash collected at check-in.',
    });

    // Notify provider — there's a new cash order they need to accept and
    // remember to collect money for at handoff.
    const { data: providerRow } = await this.supabase.client
      .from('providers')
      .select('user_id')
      .eq('id', order.provider_id)
      .single();
    const providerUserId = (providerRow as { user_id: string } | null)?.user_id;
    if (providerUserId) {
      this.events.emit('payment.cash_pending', {
        provider_user_id: providerUserId,
        order_id: order.id,
        order_number: order.order_number,
        amount: Number(order.total_price),
      });
    }

    return {
      payment,
      redirect_url: null,
      qr_code_url: null,
      deeplink: null,
      bank_info: null,
      cash_info: {
        amount: Number(order.total_price),
        instructions: 'Mang đúng số tiền mặt tới điểm check-in. Chủ hotel sẽ xác nhận khi nhận đủ.',
      },
    };
  }

  /**
   * Provider confirms cash received. Called from provider app at (or near)
   * check-in time. Flips payment.status → completed and emits the same
   * payment.completed event as online flows so the owner gets a receipt
   * notification.
   */
  async confirmCashReceived(userId: string, paymentId: string) {
    const { data: paymentData, error } = await this.supabase.client
      .from('payments')
      .select(`${PAYMENT_COLUMNS}, orders(id, order_number, owner_id, provider_id, providers(user_id))`)
      .eq('id', paymentId)
      .single();
    if (error || !paymentData) throw new NotFoundException('Payment not found');

    type OrderShape = {
      id: string;
      order_number: string;
      owner_id: string;
      provider_id: string;
      providers: { user_id: string }[] | { user_id: string } | null;
    };
    const payment = paymentData as unknown as PaymentRow & { orders: OrderShape[] | OrderShape | null };
    const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
    if (!order) throw new NotFoundException('Order for payment not found');

    const providerInner = Array.isArray(order.providers) ? order.providers[0] : order.providers;
    const providerUserId = providerInner?.user_id;
    if (providerUserId !== userId) {
      throw new ForbiddenException('Only the order provider can confirm cash receipt');
    }
    if (payment.method !== 'cash') {
      throw new BadRequestException(`Only cash payments can be confirmed (got ${payment.method})`);
    }
    if (payment.status !== 'pending') {
      throw new BadRequestException(`Payment is already in status '${payment.status}'`);
    }

    const now = new Date().toISOString();
    const { data: updated, error: upErr } = await this.supabase.client
      .from('payments')
      .update({ status: 'completed', paid_at: now })
      .eq('id', paymentId)
      .eq('status', 'pending')
      .select(PAYMENT_COLUMNS)
      .maybeSingle();
    if (upErr) throw new BadRequestException(upErr.message);
    if (!updated) throw new BadRequestException('Payment status changed concurrently');

    this.events.emit('payment.completed', {
      owner_id: order.owner_id,
      provider_user_id: providerUserId,
      order_id: order.id,
      order_number: order.order_number,
      amount: Number(payment.amount),
      gateway: 'cash',
    });

    return updated;
  }

  /**
   * Check app_config.{method}_enabled. Defaults to enabled if config row is
   * missing (don't accidentally lock out methods because someone forgot to seed).
   */
  private async isGatewayEnabled(method: string): Promise<boolean> {
    const { data } = await this.supabase.client
      .from('app_config')
      .select('value')
      .eq('key', `${method}_enabled`)
      .maybeSingle();
    const v = (data as { value: unknown } | null)?.value;
    if (v == null) return true;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v === 'true';
    return Boolean(v);
  }

  /**
   * Real PSP flow (MoMo, eventually ZaloPay/VNPay).
   * Inserts a `payments` row in `pending`, calls the gateway, returns the
   * redirect URL. Status flips to `completed` only when the IPN arrives.
   */
  private async createViaGateway(
    _userId: string,
    body: CreatePaymentInput,
    order: {
      id: string;
      order_number?: string | null;
      total_price: number | string;
      provider_id: string;
    },
    gateway: PaymentGateway,
  ) {
    // VietQR needs verified provider bank info up front — block the flow if missing.
    let providerBank: import('./gateways/gateway.interface').BankInfo | undefined;
    if (gateway.name === 'vietqr') {
      providerBank = await this.loadProviderBank(order.provider_id, {
        amount: Number(order.total_price),
        content: order.order_number ?? order.id,
      });
    }

    const { data: inserted, error: payErr } = await this.supabase.client
      .from('payments')
      .insert({
        order_id: body.order_id,
        method: body.method,
        amount: order.total_price,
        status: 'pending',
      })
      .select(PAYMENT_COLUMNS)
      .single();
    if (payErr) throw new BadRequestException(payErr.message);
    const payment = inserted as PaymentRow;

    const returnUrl =
      body.return_url ?? this.config.get<string>('PAYMENTS_V1_RETURN_URL') ?? '';
    const ipnBase = this.config.get<string>('PAYMENTS_V1_IPN_BASE_URL') ?? '';
    const ipnUrl = `${ipnBase}/api/payments/callback/${gateway.name}`;

    let initiation;
    try {
      initiation = await gateway.initiate({
        payment_id: payment.id,
        order_id: order.id,
        order_number: order.order_number ?? '',
        amount: Number(order.total_price),
        description: `PetZone order ${order.order_number ?? order.id}`,
        return_url: returnUrl,
        ipn_url: ipnUrl,
        provider_bank: providerBank,
      });
    } catch (err) {
      await this.supabase.client
        .from('payments')
        .update({ status: 'failed', gateway_response: { error: (err as Error).message } })
        .eq('id', payment.id);
      throw err;
    }

    await this.supabase.client
      .from('payments')
      .update({
        transaction_ref: initiation.gateway_order_id,
        gateway_response: initiation.raw,
      })
      .eq('id', payment.id);

    return {
      payment: { ...payment, transaction_ref: initiation.gateway_order_id },
      redirect_url: initiation.redirect_url || null,
      qr_code_url: initiation.qr_code_url ?? null,
      deeplink: initiation.deeplink ?? null,
      bank_info: initiation.bank_info ?? null,
    };
  }

  /**
   * Build the BankInfo for VietQR initiate. Fails fast if the provider hasn't
   * registered/verified bank info — owners must not see an unusable QR.
   */
  private async loadProviderBank(
    providerId: string,
    { amount, content }: { amount: number; content: string },
  ): Promise<import('./gateways/gateway.interface').BankInfo> {
    const { data, error } = await this.supabase.client
      .from('providers')
      .select('bank_name, bank_account_number_encrypted, bank_account_holder, bank_verified_at')
      .eq('id', providerId)
      .single();
    if (error || !data) throw new NotFoundException('Provider not found');
    const row = data as {
      bank_name: string | null;
      bank_account_number_encrypted: string | null;
      bank_account_holder: string | null;
      bank_verified_at: string | null;
    };
    if (!row.bank_name || !row.bank_account_number_encrypted || !row.bank_account_holder) {
      throw new BadRequestException(
        'Provider has not registered bank account yet — cannot accept VietQR payment',
      );
    }
    if (!row.bank_verified_at) {
      throw new BadRequestException(
        'Provider bank account not verified by admin — cannot accept VietQR payment',
      );
    }
    return {
      bank_name: row.bank_name,
      account_number: row.bank_account_number_encrypted,
      account_holder: row.bank_account_holder,
      content,
      amount,
    };
  }

  /**
   * bank_transfer flow — no gateway. Owner gets bank info on the client; an
   * admin manually marks the payment completed once funds land. We keep the
   * row in `pending` and rely on admin tooling.
   */
  private async createManual(
    _userId: string,
    body: CreatePaymentInput,
    order: { total_price: number | string },
  ) {
    const transactionRef = `BT-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const { data: payment, error } = await this.supabase.client
      .from('payments')
      .insert({
        order_id: body.order_id,
        method: body.method,
        amount: order.total_price,
        status: 'pending',
        transaction_ref: transactionRef,
      })
      .select(PAYMENT_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);
    return { payment, redirect_url: null, qr_code_url: null, deeplink: null };
  }

  /**
   * Webhook entry point. Logs every inbound IPN — valid or not — then runs
   * idempotent state machine for verified events. Always returns a 200-shaped
   * body so gateways stop retrying; failures are recorded in the log.
   */
  async processWebhook(gatewayName: string, rawBody: Record<string, unknown>, headers: Record<string, string>) {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      await this.logWebhook(gatewayName, 'collection', rawBody, headers, false, null, null, 'no_gateway_adapter');
      // SePay/MoMo dùng response format khác nhau. Trả format chung an toàn cho cả 2:
      // SePay yêu cầu { success: true } để KHÔNG retry (tránh spam 7 lần)
      // MoMo chỉ check HTTP 200 — body bất kỳ JSON đều OK
      return { success: false, resultCode: 99, message: 'no_gateway_adapter' };
    }

    const sigValid = gateway.verifyWebhookSignature(rawBody, headers);
    let kind: WebhookKind = 'collection';
    let event;
    let parseError: string | null = null;
    try {
      kind = gateway.detectWebhookKind(rawBody);
      event = gateway.parseWebhook(rawBody, kind);
    } catch (err) {
      parseError = (err as Error).message;
    }

    // VietQR: parser surfaces the order_number in gateway_transaction_id;
    // resolve to payment_id by lookup. Other gateways set payment_id directly.
    if (gatewayName === 'vietqr' && event && !event.payment_id && event.gateway_transaction_id) {
      event.payment_id = (await this.resolveVietQRPayment(event.gateway_transaction_id, event.amount)) ?? '';
    }

    // VietQR: always record the raw bank notification, matched or not.
    if (gatewayName === 'vietqr' && sigValid && event) {
      await this.recordBankTransaction(rawBody, event, event.payment_id || null);
    }

    const eventId = event?.event_id ?? null;
    const paymentId = event?.payment_id ?? null;

    if (!sigValid) {
      this.logger.warn(`[${gatewayName} webhook] invalid signature`);
      await this.logWebhook(gatewayName, kind, rawBody, headers, false, eventId, paymentId, 'invalid_signature');
      // success=false để admin biết, nhưng vẫn HTTP 200 — không cho gateway retry
      // (retry với chữ ký sai cũng vô ích)
      return { success: false, resultCode: 97, message: 'invalid_signature' };
    }
    if (!event || parseError) {
      this.logger.error(`[${gatewayName} webhook] parse failed: ${parseError}`);
      await this.logWebhook(gatewayName, kind, rawBody, headers, true, eventId, paymentId, parseError ?? 'parse_failed');
      return { success: false, resultCode: 98, message: 'parse_failed' };
    }

    // Idempotency: bail if this exact event_id has already been processed.
    if (eventId) {
      const { count } = await this.supabase.client
        .from('payments_webhook_log')
        .select('id', { count: 'exact', head: true })
        .eq('gateway', gatewayName)
        .eq('gateway_event_id', eventId)
        .not('processed_at', 'is', null);
      if (count && count > 0) {
        return { success: true, resultCode: 0, message: 'idempotent' };
      }
    }

    const { data: logRow } = await this.supabase.client
      .from('payments_webhook_log')
      .insert({
        gateway: gatewayName,
        kind,
        raw_body: rawBody,
        headers,
        signature_valid: true,
        gateway_event_id: eventId,
        payment_id: paymentId,
      })
      .select('id')
      .single();

    try {
      if (kind === 'collection') {
        await this.applyCollection(event, gatewayName);
      } else {
        await this.applyRefundIpn(event);
      }
      if (logRow?.id) {
        await this.supabase.client
          .from('payments_webhook_log')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', logRow.id);
      }
      return { success: true, resultCode: 0, message: 'success' };
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`[${gatewayName} webhook] apply failed: ${msg}`);
      if (logRow?.id) {
        await this.supabase.client
          .from('payments_webhook_log')
          .update({ parse_error: msg })
          .eq('id', logRow.id);
      }
      // apply_failed CÓ THỂ là lỗi tạm thời (DB timeout) → return success=false
      // để SePay retry. Retry 7 lần Fibonacci sẽ catch được.
      return { success: false, resultCode: 96, message: 'apply_failed' };
    }
  }

  /**
   * DEV/TEST ONLY — simulate a successful SePay webhook for a VietQR payment.
   * Lets the mobile team E2E-test the full flow (create QR → polling →
   * success screen) without leaving the app to use SePay's dashboard.
   *
   * Guards:
   *   - DEV_SIMULATE_ENABLED must be 'true' (default off).
   *   - Caller must own the order (same check as confirmReceive).
   *   - Payment must be method='vietqr' and status='pending'.
   *   - WARN log every call so it's visible in Railway logs if accidentally
   *     enabled on prod.
   */
  async devSimulateVietQRPaid(userId: string, paymentId: string) {
    const enabled = this.config.get<string>('DEV_SIMULATE_ENABLED') === 'true';
    if (!enabled) {
      throw new ForbiddenException('Dev simulate endpoint is disabled');
    }

    const { data: paymentData, error: payErr } = await this.supabase.client
      .from('payments')
      .select(`${PAYMENT_COLUMNS}, orders(id, owner_id, order_number, total_price, provider_id)`)
      .eq('id', paymentId)
      .single();
    if (payErr || !paymentData) throw new NotFoundException('Payment not found');

    type OrderRow = { id: string; owner_id: string; order_number: string; total_price: number; provider_id: string };
    const payment = paymentData as unknown as PaymentRow & { orders: OrderRow[] | OrderRow | null };
    const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
    if (!order) throw new NotFoundException('Order for payment not found');

    if (order.owner_id !== userId) {
      throw new ForbiddenException('Only the order owner can simulate payment');
    }
    if (payment.method !== 'vietqr') {
      throw new BadRequestException(`Only VietQR payments can be simulated (got ${payment.method})`);
    }
    if (payment.status !== 'pending') {
      throw new BadRequestException(`Payment is already in status '${payment.status}'`);
    }

    this.logger.warn(
      `[DEV-SIMULATE] Faking VietQR payment success — payment=${paymentId} order=${order.order_number} user=${userId}`,
    );

    // Build a synthetic SePay payload identical in shape to what their
    // webhook would deliver, then run through the real applyCollection path
    // so we hit every side-effect (history, bank_transactions, order flip).
    const fakeRefId = `DEVSIM-${Date.now()}`;
    const fakeRawBody: Record<string, unknown> = {
      id: fakeRefId,
      gateway: 'DEV-SIMULATE',
      transactionDate: new Date().toISOString(),
      accountNumber: 'DEV-SIMULATE',
      content: `${order.order_number} dev simulate`,
      transferType: 'in',
      transferAmount: Number(order.total_price),
      referenceCode: fakeRefId,
    };
    const event = {
      kind: 'collection' as const,
      event_id: fakeRefId,
      payment_id: payment.id,
      gateway_transaction_id: order.order_number,
      status: 'success' as const,
      amount: Number(order.total_price),
      raw: fakeRawBody,
    };

    await this.recordBankTransaction(fakeRawBody, event, payment.id);
    await this.applyCollection(event, 'vietqr');

    const { data: refreshed } = await this.supabase.client
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('id', paymentId)
      .single();
    return { simulated: true, payment: refreshed };
  }

  /**
   * Successful collection: flip payment to completed, move order to pending,
   * write escrow hold, write history. Status guard prevents double-apply when
   * two IPNs race.
   */
  private async applyCollection(
    event: { payment_id: string; status: string; gateway_transaction_id?: string; failure_reason?: string },
    gatewayName: string,
  ) {
    const { data: paymentRow } = await this.supabase.client
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('id', event.payment_id)
      .maybeSingle();
    const payment = paymentRow as PaymentRow | null;
    if (!payment) {
      this.logger.warn(`[${gatewayName} webhook] unknown payment_id=${event.payment_id}`);
      return;
    }

    if (event.status !== 'success') {
      // Capture failure — leave order in pending_payment so owner can retry.
      await this.supabase.client
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id)
        .eq('status', 'pending');
      return;
    }

    if (payment.status !== 'pending') return; // race guard

    const now = new Date().toISOString();
    const { data: updatedPayment, error: payErr } = await this.supabase.client
      .from('payments')
      .update({
        status: 'completed',
        paid_at: now,
        transaction_ref: event.gateway_transaction_id ?? payment.transaction_ref,
      })
      .eq('id', payment.id)
      .eq('status', 'pending')
      .select(PAYMENT_COLUMNS)
      .maybeSingle();
    if (payErr) throw new BadRequestException(payErr.message);
    if (!updatedPayment) return; // lost the race — another worker already applied

    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const { data: order } = await this.supabase.client
      .from('orders')
      .select('id, order_number, status, owner_id, provider_id, providers(user_id)')
      .eq('id', payment.order_id)
      .single();
    if (!order || order.status !== 'pending_payment') return;

    await this.supabase.client
      .from('orders')
      .update({ status: 'pending', provider_response_deadline: deadline, updated_at: now })
      .eq('id', payment.order_id)
      .eq('status', 'pending_payment');

    // VietQR is direct-to-provider — PetZone never holds the money, so no
    // escrow_ledger hold. Other gateways collect into PetZone's merchant
    // account; ledger row tracks the virtual hold.
    if (gatewayName !== 'vietqr') {
      await this.supabase.client.from('escrow_ledger').insert({
        order_id: payment.order_id,
        type: 'hold',
        amount: payment.amount,
        balance_after: payment.amount,
        description: `Payment hold for order ${order.order_number ?? payment.order_id}`,
      });
    }

    await this.supabase.client.from('order_status_history').insert({
      order_id: payment.order_id,
      status: 'pending',
      actor_id: null,
      actor_type: 'system',
      note:
        gatewayName === 'vietqr'
          ? `Payment received via VietQR direct transfer. Awaiting provider confirmation.`
          : `Payment captured via ${gatewayName}. Awaiting provider confirmation.`,
    });

    // For VietQR: link the bank_transactions row to this payment.
    if (gatewayName === 'vietqr') {
      await this.supabase.client
        .from('bank_transactions')
        .update({ matched_payment_id: payment.id, matched_at: now })
        .eq('matched_order_number', order.order_number)
        .is('matched_payment_id', null);
    }

    // Emit semantic event — NotificationsListener fans out FCM push to owner + provider.
    const providers = (order as { providers?: { user_id: string }[] | { user_id: string } | null }).providers;
    const providerUserId = Array.isArray(providers) ? providers[0]?.user_id : providers?.user_id;
    this.events.emit('payment.completed', {
      owner_id: (order as { owner_id: string }).owner_id,
      provider_user_id: providerUserId,
      order_id: payment.order_id,
      order_number: order.order_number,
      amount: Number(payment.amount),
      gateway: gatewayName,
    });
  }

  /**
   * Find a pending VietQR payment by order_number + amount. Amount match
   * prevents matching a partial / wrong-amount transfer.
   */
  private async resolveVietQRPayment(orderNumber: string, amount?: number): Promise<string | null> {
    const { data: order } = await this.supabase.client
      .from('orders')
      .select('id, total_price')
      .eq('order_number', orderNumber)
      .maybeSingle();
    if (!order) return null;
    if (amount != null && Number(amount) !== Number(order.total_price)) {
      this.logger.warn(
        `[vietqr] amount mismatch order=${orderNumber} expected=${order.total_price} got=${amount}`,
      );
      return null;
    }
    const { data: payment } = await this.supabase.client
      .from('payments')
      .select('id')
      .eq('order_id', order.id)
      .eq('method', 'vietqr')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (payment as { id: string } | null)?.id ?? null;
  }

  /**
   * Mirror an inbound SePay event into bank_transactions for reconciliation.
   * Idempotent via (source, source_event_id) unique index.
   */
  private async recordBankTransaction(
    rawBody: Record<string, unknown>,
    event: { event_id: string; gateway_transaction_id?: string; amount?: number; status: string },
    paymentId: string | null,
  ) {
    const sourceEventId = event.event_id || String(rawBody.id ?? '');
    const occurredAt = rawBody.transactionDate
      ? new Date(String(rawBody.transactionDate)).toISOString()
      : new Date().toISOString();
    const matchedAt = paymentId ? new Date().toISOString() : null;

    await this.supabase.client.from('bank_transactions').insert({
      source: 'sepay',
      source_event_id: sourceEventId,
      bank_brand: rawBody.gateway != null ? String(rawBody.gateway) : null,
      account_number: String(rawBody.accountNumber ?? rawBody.subAccount ?? ''),
      amount: event.amount ?? 0,
      content: String(rawBody.content ?? ''),
      reference_code: rawBody.referenceCode != null ? String(rawBody.referenceCode) : null,
      transfer_type: String(rawBody.transferType ?? 'in'),
      occurred_at: occurredAt,
      matched_payment_id: paymentId,
      matched_order_number: event.gateway_transaction_id ?? null,
      matched_at: matchedAt,
      raw_payload: rawBody,
      signature_valid: true,
    });
  }

  /**
   * Refund IPN: settle the matching refund row + payment refund_amount.
   * Caller of refund() created the refund row in 'processing'; we move to
   * 'completed' or 'failed' here.
   */
  private async applyRefundIpn(event: {
    payment_id: string;
    status: string;
    amount?: number;
    event_id: string;
    failure_reason?: string;
  }) {
    if (event.status !== 'success') {
      await this.supabase.client
        .from('refunds')
        .update({ status: 'failed', gateway_response: { error: event.failure_reason } })
        .eq('payment_id', event.payment_id)
        .eq('status', 'processing');
      return;
    }

    const { data: refundRow } = await this.supabase.client
      .from('refunds')
      .select('id, amount')
      .eq('payment_id', event.payment_id)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!refundRow) return;

    const now = new Date().toISOString();
    await this.supabase.client
      .from('refunds')
      .update({ status: 'completed', completed_at: now })
      .eq('id', refundRow.id);
  }

  callback(_gateway: string) {
    // Legacy noop — superseded by processWebhook(). Kept so the public
    // /api/payments/callback/:gateway route compiles during cutover.
    return { resultCode: 0 };
  }

  async findByOrder(userId: string, orderId: string) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    const isOwner = order.owner_id === userId;
    const providers = (order as Record<string, unknown>).providers as { user_id: string }[] | { user_id: string } | null;
    const providerUserId = Array.isArray(providers) ? providers[0]?.user_id : providers?.user_id;
    const isProvider = providerUserId === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('No access to this order');

    const { data: payment, error } = await this.supabase.client
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !payment) throw new NotFoundException('Payment not found');

    return payment;
  }

  async refund(userId: string, orderId: string, body: RefundInput) {
    const { data: order, error: orderErr } = await this.supabase.client
      .from('orders')
      .select(`${ORDER_COLUMNS}, providers(id, user_id)`)
      .eq('id', orderId)
      .single();
    if (orderErr || !order) throw new NotFoundException('Order not found');

    const isOwner = order.owner_id === userId;
    const providers = (order as Record<string, unknown>).providers as { user_id: string }[] | { user_id: string } | null;
    const providerUserId = Array.isArray(providers) ? providers[0]?.user_id : providers?.user_id;
    const isProvider = providerUserId === userId;
    if (!isOwner && !isProvider) throw new ForbiddenException('Not authorized to refund this order');

    const { data: paymentRow, error: payErr } = await this.supabase.client
      .from('payments')
      .select(PAYMENT_COLUMNS)
      .eq('order_id', orderId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (payErr || !paymentRow) throw new NotFoundException('No completed payment found for this order');
    const payment = paymentRow as PaymentRow;

    const alreadyRefunded = Number(payment.refund_amount) || 0;
    const remainingRefundable = Number(payment.amount) - alreadyRefunded;
    if (body.amount > remainingRefundable)
      throw new BadRequestException(`Refund amount exceeds remaining refundable amount (${remainingRefundable})`);

    const refundRequestId = `RF-${payment.id}-${Date.now()}`;
    let gatewayRefundId: string | null = null;
    const gateway = this.gateways.get(payment.method);
    if (gateway && payment.transaction_ref) {
      const result = await gateway.refund({
        refund_request_id: refundRequestId,
        gateway_transaction_id: payment.transaction_ref,
        amount: body.amount,
        reason: body.reason,
      });
      gatewayRefundId = result.gateway_refund_id;
    }

    const { data: refund, error: refErr } = await this.supabase.client
      .from('refunds')
      .insert({
        order_id: orderId,
        payment_id: payment.id,
        amount: body.amount,
        type: body.type,
        reason: body.reason,
        status: 'processing',
        processed_by: userId,
        gateway_response: gatewayRefundId ? { gateway_refund_id: gatewayRefundId } : null,
      })
      .select()
      .single();
    if (refErr) throw new BadRequestException(refErr.message);

    // Note: payments.status flips to refunded/partially_refunded only when the
    // refund IPN settles (handled in applyRefundIpn). Keep `processing` here.
    const now = new Date().toISOString();
    await this.supabase.client
      .from('payments')
      .update({
        refund_amount: (Number(payment.refund_amount) || 0) + body.amount,
        status: body.type === 'full' ? 'refunded' : 'partially_refunded',
        refunded_at: now,
        updated_at: now,
      })
      .eq('id', payment.id);

    const { data: lastLedger } = await this.supabase.client
      .from('escrow_ledger')
      .select('balance_after')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    const balanceAfter = (Number(lastLedger?.balance_after) || 0) - body.amount;

    await this.supabase.client.from('escrow_ledger').insert({
      order_id: orderId,
      type: 'refund',
      amount: body.amount,
      balance_after: balanceAfter,
      description: `Refund (${body.type}): ${body.reason}`,
    });

    return refund;
  }

  async getPayouts(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data: provider, error: provErr } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (provErr || !provider) throw new ForbiddenException('Not a provider');

    const { data, error, count } = await this.supabase.client
      .from('provider_payouts')
      .select(PAYOUT_COLUMNS, { count: 'exact' })
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);
    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async requestPayout(userId: string) {
    const { data: provider, error: provErr } = await this.supabase.client
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (provErr || !provider) throw new ForbiddenException('Not a provider');

    const commissionRate = await this.getCommissionRateV1();

    // Join payments to filter out VietQR orders — those are direct transfers,
    // PetZone never collected money for them, so no payout to enqueue.
    const [completedResult, payoutsResult] = await Promise.all([
      this.supabase.client
        .from('orders')
        .select('id, total_price, payments(method, status)')
        .eq('provider_id', provider.id)
        .eq('status', 'completed'),
      this.supabase.client
        .from('provider_payouts')
        .select('order_id')
        .eq('provider_id', provider.id),
    ]);

    const allCompleted = completedResult.data as
      | { id: string; total_price: number; payments: { method: string; status: string }[] | { method: string; status: string } | null }[]
      | null;
    const existingPayouts = payoutsResult.data;

    const paidOrderIds = new Set((existingPayouts || []).map((p: { order_id: string }) => p.order_id));
    const unpaidOrders = (allCompleted || []).filter((o) => {
      if (paidOrderIds.has(o.id)) return false;
      const pays = Array.isArray(o.payments) ? o.payments : o.payments ? [o.payments] : [];
      const completedPay = pays.find((p) => p.status === 'completed');
      // VietQR orders are already paid directly to provider — skip payout enqueue.
      return completedPay && completedPay.method !== 'vietqr';
    });

    if (!unpaidOrders.length) throw new BadRequestException('No completed orders available for payout');

    const payouts = unpaidOrders.flatMap((order) => {
      const gross = Number(order.total_price);
      const commission = Math.round(gross * commissionRate);
      const providerNet = gross - commission;
      return [
        {
          provider_id: provider.id,
          order_id: order.id,
          recipient: 'provider',
          gross_amount: gross,
          commission_rate: commissionRate,
          commission_amount: commission,
          net_amount: providerNet,
          status: 'pending',
        },
        {
          provider_id: provider.id,
          order_id: order.id,
          recipient: 'petzone',
          gross_amount: gross,
          commission_rate: commissionRate,
          commission_amount: commission,
          net_amount: commission,
          status: 'pending',
        },
      ];
    });

    const { data: created, error: insertErr } = await this.supabase.client
      .from('provider_payouts')
      .insert(payouts)
      .select(PAYOUT_COLUMNS);
    if (insertErr) throw new BadRequestException(insertErr.message);

    return created;
  }

  /**
   * Owner cancels a pending payment (e.g. close out an abandoned MoMo redirect
   * or VietQR QR they decided not to pay). The order stays in pending_payment
   * so they can pick a different method and retry without losing the order.
   *
   * Only payments in 'pending' can be cancelled — completed/failed/refunded
   * are terminal from the owner's side.
   */
  async cancelPending(userId: string, paymentId: string) {
    const { data: paymentData, error } = await this.supabase.client
      .from('payments')
      .select(`${PAYMENT_COLUMNS}, orders(id, owner_id, order_number)`)
      .eq('id', paymentId)
      .single();
    if (error || !paymentData) throw new NotFoundException('Payment not found');

    type OrderRow = { id: string; owner_id: string; order_number: string };
    const payment = paymentData as unknown as PaymentRow & { orders: OrderRow[] | OrderRow | null };
    const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
    if (!order) throw new NotFoundException('Order for payment not found');
    if (order.owner_id !== userId) {
      throw new ForbiddenException('Only the order owner can cancel this payment');
    }
    if (payment.status !== 'pending') {
      throw new BadRequestException(`Cannot cancel payment in status '${payment.status}'`);
    }

    const { data: updated, error: upErr } = await this.supabase.client
      .from('payments')
      .update({
        status: 'failed',
        gateway_response: { cancelled_by: 'owner', cancelled_at: new Date().toISOString() },
      })
      .eq('id', paymentId)
      .eq('status', 'pending')
      .select(PAYMENT_COLUMNS)
      .maybeSingle();
    if (upErr) throw new BadRequestException(upErr.message);
    if (!updated) {
      // Lost the race — webhook flipped it to completed first
      throw new BadRequestException('Payment was just completed — cannot cancel');
    }

    this.logger.log(
      `Payment ${paymentId} (order ${order.order_number}) cancelled by owner ${userId}`,
    );
    return updated;
  }

  /**
   * v1 commission rate from app_config (admin-editable). Fallback to the
   * shared constant only if config is missing — never silently default to 0
   * once the trial is over.
   */
  private async getCommissionRateV1(): Promise<number> {
    const { data } = await this.supabase.client
      .from('app_config')
      .select('value')
      .eq('key', 'commission_rate_v1')
      .maybeSingle();
    const raw = (data as { value: unknown } | null)?.value;
    if (raw == null) return COMMISSION_RATE;
    const n = typeof raw === 'string' ? Number(raw) : Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 1 ? n : COMMISSION_RATE;
  }

  private async logWebhook(
    gateway: string,
    kind: WebhookKind,
    rawBody: Record<string, unknown>,
    headers: Record<string, string>,
    signatureValid: boolean,
    eventId: string | null,
    paymentId: string | null,
    parseError: string | null,
  ) {
    await this.supabase.client.from('payments_webhook_log').insert({
      gateway,
      kind,
      raw_body: rawBody,
      headers,
      signature_valid: signatureValid,
      gateway_event_id: eventId,
      payment_id: paymentId,
      parse_error: parseError,
    });
  }
}
