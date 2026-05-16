import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  PaymentProvider,
  InitiatePaymentRequest,
  InitiatePaymentResult,
  DisbursementRequest,
  DisbursementResult,
  RefundRequest,
  RefundResult,
  ParsedWebhookEvent,
  PspWebhookKind,
} from './psp.interface';

/**
 * Dev/test PSP. Returns fake redirect URLs and disbursement IDs. Webhook
 * signature is always considered valid. Tests can hand-craft IPN bodies and
 * call the controller endpoints directly.
 */
@Injectable()
export class MockProvider implements PaymentProvider {
  readonly name = 'mock' as const;
  private readonly logger = new Logger(MockProvider.name);

  async initiatePayment(req: InitiatePaymentRequest): Promise<InitiatePaymentResult> {
    const pspOrderId = `MOCK-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    this.logger.log(`[mock] initiatePayment order=${req.order_id} amount=${req.amount} method=${req.method} → ${pspOrderId}`);
    return {
      psp_order_id: pspOrderId,
      payment_url: `https://mock-psp.local/pay/${pspOrderId}`,
    };
  }

  async disburse(req: DisbursementRequest): Promise<DisbursementResult> {
    const id = `MOCK-DSB-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    this.logger.log(`[mock] disburse amount=${req.amount} to=${req.recipient.account_number} key=${req.idempotency_key} → ${id}`);
    return { psp_disbursement_id: id };
  }

  async refund(req: RefundRequest): Promise<RefundResult> {
    const id = `MOCK-REF-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    this.logger.log(`[mock] refund psp_order=${req.psp_order_id} amount=${req.amount}`);
    return { psp_refund_id: id };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  parseWebhook(rawBody: string, _headers: Record<string, string>, kind: PspWebhookKind): ParsedWebhookEvent {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    return {
      kind,
      event_id: String(body.event_id ?? randomUUID()),
      psp_order_id: body.psp_order_id as string | undefined,
      psp_disbursement_id: body.psp_disbursement_id as string | undefined,
      psp_refund_id: body.psp_refund_id as string | undefined,
      amount: body.amount as number | undefined,
      method: body.method as ParsedWebhookEvent['method'],
      status: (body.status as ParsedWebhookEvent['status']) ?? 'success',
      failure_reason: body.failure_reason as string | undefined,
      raw: body,
    };
  }
}
