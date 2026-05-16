import type { PaymentMethod } from '@petzone/shared';

export type GatewayName = Extract<PaymentMethod, 'momo' | 'zalopay' | 'vnpay' | 'vietqr'>;

export interface BankInfo {
  bank_name: string;
  account_number: string;
  account_holder: string;
  content: string;
  amount: number;
}

export interface InitiateRequest {
  /** PetZone payment row UUID — used as the gateway's orderId. */
  payment_id: string;
  /** PetZone order UUID — for description/audit only. */
  order_id: string;
  /** Order number (e.g. PB-20260516-0001) — used as VietQR transfer memo. */
  order_number: string;
  amount: number;
  description: string;
  return_url: string;
  ipn_url: string;
  /** Required for VietQR; ignored by gateways that collect into PetZone. */
  provider_bank?: BankInfo;
}

export interface InitiateResult {
  /** Empty string for in-app QR flows (VietQR) — no external redirect. */
  redirect_url: string;
  /** Gateway-provided reference at creation time (e.g., MoMo orderId echoed back). */
  gateway_order_id: string;
  qr_code_url?: string;
  deeplink?: string;
  /** For VietQR / bank-transfer flows: info the app shows so owner can pay. */
  bank_info?: BankInfo;
  raw: Record<string, unknown>;
}

export interface RefundRequest {
  /** Local idempotency key — must be unique per refund attempt. */
  refund_request_id: string;
  /** Gateway tx id captured at IPN time (MoMo transId). */
  gateway_transaction_id: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  gateway_refund_id: string;
  raw: Record<string, unknown>;
}

export type WebhookKind = 'collection' | 'refund';

export interface ParsedWebhookEvent {
  kind: WebhookKind;
  /** Stable id used for idempotency. MoMo: transId for collection, refundTrans for refund. */
  event_id: string;
  /** PetZone payment.id (decoded from gateway orderId/echo). */
  payment_id: string;
  /** Gateway-side tx id (e.g. MoMo transId). Set on successful collection. */
  gateway_transaction_id?: string;
  status: 'success' | 'failed' | 'pending';
  amount?: number;
  failure_reason?: string;
  raw: Record<string, unknown>;
}

/**
 * v1 payment gateway port. Per-method implementations: MomoGateway (live),
 * ZalopayGateway / VnpayGateway (TBD). bank_transfer has no adapter — handled
 * manually by admin.
 */
export interface PaymentGateway {
  readonly name: GatewayName;
  initiate(req: InitiateRequest): Promise<InitiateResult>;
  refund(req: RefundRequest): Promise<RefundResult>;
  verifyWebhookSignature(body: Record<string, unknown>, headers: Record<string, string>): boolean;
  detectWebhookKind(body: Record<string, unknown>): WebhookKind;
  parseWebhook(body: Record<string, unknown>, kind: WebhookKind): ParsedWebhookEvent;
}

export const PAYMENT_GATEWAYS = Symbol('PAYMENT_GATEWAYS');
