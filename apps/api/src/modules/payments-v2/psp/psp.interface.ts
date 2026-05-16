import type { PaymentV2Method, PspProvider } from '@petzone/shared';

export interface InitiatePaymentRequest {
  order_id: string;
  amount: number;
  currency: 'VND';
  method: PaymentV2Method;
  return_url?: string;
  description?: string;
}

export interface InitiatePaymentResult {
  psp_order_id: string;
  payment_url: string;
}

export interface DisbursementRequest {
  idempotency_key: string;
  amount: number;
  currency: 'VND';
  recipient: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  description: string;
}

export interface DisbursementResult {
  psp_disbursement_id: string;
}

export interface RefundRequest {
  psp_order_id: string;
  amount: number;
  reason: string;
  idempotency_key: string;
}

export interface RefundResult {
  psp_refund_id: string;
}

export type PspWebhookKind = 'collection' | 'disbursement' | 'refund';

export interface ParsedWebhookEvent {
  kind: PspWebhookKind;
  event_id: string;
  // For collection IPNs
  psp_order_id?: string;
  amount?: number;
  status: 'success' | 'failed' | 'pending';
  method?: PaymentV2Method;
  // For disbursement IPNs
  psp_disbursement_id?: string;
  // For refund IPNs
  psp_refund_id?: string;
  failure_reason?: string;
  raw: Record<string, unknown>;
}

/**
 * PSP port — implementations: NinepayProvider (prod), MockProvider (dev/test).
 * All amounts in VND, integer.
 */
export interface PaymentProvider {
  readonly name: PspProvider;

  initiatePayment(req: InitiatePaymentRequest): Promise<InitiatePaymentResult>;

  disburse(req: DisbursementRequest): Promise<DisbursementResult>;

  refund(req: RefundRequest): Promise<RefundResult>;

  // Returns true if signature is valid for the given raw body + headers.
  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean;

  parseWebhook(
    rawBody: string,
    headers: Record<string, string>,
    kind: PspWebhookKind,
  ): ParsedWebhookEvent;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
