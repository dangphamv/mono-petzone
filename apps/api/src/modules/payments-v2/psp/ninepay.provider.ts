import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
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
 * 9Pay implementation. Reference docs: developers.9pay.vn
 *
 * Auth scheme: HMAC-SHA256.
 *   Header: Authorization: Signature Algorithm=HS256,Credential=<merchant_key>,SignedHeaders=,Signature=<sig>
 *   Header: Date: <unix-ts>
 *   Signed string: METHOD + URI + ts + sorted-form-encoded-params
 *
 * NOTE: Exact IPN field list, signature header name, and sandbox base URL
 * differ between 9Pay's public docs and the merchant integration packet.
 * Confirm with 9Pay integration team before staging cutover. Until then,
 * MockProvider is used by default (NINEPAY_ENABLED=false).
 */
@Injectable()
export class NinepayProvider implements PaymentProvider {
  readonly name = '9pay' as const;
  private readonly logger = new Logger(NinepayProvider.name);
  private readonly baseUrl: string;
  private readonly merchantKey: string;
  private readonly secret: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('NINEPAY_BASE_URL') ?? 'https://sand-payment.9pay.vn';
    this.merchantKey = config.get<string>('NINEPAY_MERCHANT_KEY') ?? '';
    this.secret = config.get<string>('NINEPAY_SECRET') ?? '';
    this.webhookSecret = config.get<string>('NINEPAY_WEBHOOK_SECRET') ?? '';
    if (!this.merchantKey || !this.secret || !this.webhookSecret) {
      this.logger.warn('9Pay credentials missing; live calls will fail');
    }
  }

  async initiatePayment(req: InitiatePaymentRequest): Promise<InitiatePaymentResult> {
    const params = {
      merchantKey: this.merchantKey,
      time: Math.floor(Date.now() / 1000).toString(),
      invoice_no: req.order_id,
      amount: req.amount.toString(),
      description: req.description ?? `PetZone order ${req.order_id}`,
      back_url: req.return_url ?? '',
      method: this.mapMethod(req.method),
    };

    const signed = this.sign('POST', '/payments/create', params);
    const res = await this.call('POST', '/payments/create', params, signed);
    const data = res as { invoice_no?: string; redirect_url?: string };
    if (!data.invoice_no || !data.redirect_url) {
      throw new ServiceUnavailableException('9Pay initiate response missing fields');
    }
    return { psp_order_id: data.invoice_no, payment_url: data.redirect_url };
  }

  async disburse(req: DisbursementRequest): Promise<DisbursementResult> {
    const params = {
      merchantKey: this.merchantKey,
      time: Math.floor(Date.now() / 1000).toString(),
      reference_id: req.idempotency_key,
      amount: req.amount.toString(),
      bank_code: req.recipient.bank_name,
      account_no: req.recipient.account_number,
      account_name: req.recipient.account_holder,
      description: req.description,
    };
    const signed = this.sign('POST', '/disbursements/create', params);
    const res = await this.call('POST', '/disbursements/create', params, signed);
    const data = res as { disbursement_id?: string };
    if (!data.disbursement_id) {
      throw new ServiceUnavailableException('9Pay disburse response missing disbursement_id');
    }
    return { psp_disbursement_id: data.disbursement_id };
  }

  async refund(req: RefundRequest): Promise<RefundResult> {
    const params = {
      merchantKey: this.merchantKey,
      time: Math.floor(Date.now() / 1000).toString(),
      invoice_no: req.psp_order_id,
      amount: req.amount.toString(),
      reason: req.reason,
      reference_id: req.idempotency_key,
    };
    const signed = this.sign('POST', '/v2/refunds/create', params);
    const res = await this.call('POST', '/v2/refunds/create', params, signed);
    const data = res as { refund_id?: string };
    if (!data.refund_id) {
      throw new ServiceUnavailableException('9Pay refund response missing refund_id');
    }
    return { psp_refund_id: data.refund_id };
  }

  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean {
    const sigHeader = headers['x-9pay-signature'] ?? headers['signature'];
    if (!sigHeader || !this.webhookSecret) return false;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    try {
      const expectedBuf = Buffer.from(expected, 'hex');
      const gotBuf = Buffer.from(sigHeader, 'hex');
      if (expectedBuf.length !== gotBuf.length) return false;
      return timingSafeEqual(expectedBuf, gotBuf);
    } catch {
      return false;
    }
  }

  parseWebhook(rawBody: string, _headers: Record<string, string>, kind: PspWebhookKind): ParsedWebhookEvent {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const status = this.mapStatus(body.status as string | number | undefined, body.error_code as string | undefined);
    const eventId = String(body.event_id ?? body.transaction_id ?? body.invoice_no ?? '');
    return {
      kind,
      event_id: eventId,
      psp_order_id: body.invoice_no as string | undefined,
      psp_disbursement_id: body.disbursement_id as string | undefined,
      psp_refund_id: body.refund_id as string | undefined,
      amount: body.amount ? Number(body.amount) : undefined,
      method: this.unmapMethod(body.payment_method as string),
      status,
      failure_reason: body.error_message as string | undefined,
      raw: body,
    };
  }

  private sign(method: string, uri: string, params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    const canonical = sortedKeys.map((k) => `${k}=${encodeURIComponent(params[k])}`).join('&');
    const stringToSign = `${method}\n${uri}\n${params.time}\n${canonical}`;
    const sig = createHmac('sha256', this.secret).update(stringToSign).digest('hex');
    return `Signature Algorithm=HS256,Credential=${this.merchantKey},SignedHeaders=,Signature=${sig}`;
  }

  private async call(
    method: string,
    path: string,
    params: Record<string, string>,
    authHeader: string,
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const body = new URLSearchParams(params).toString();
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader,
        Date: params.time,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`9Pay ${path} ${res.status}: ${text}`);
      throw new ServiceUnavailableException(`9Pay call failed (${res.status})`);
    }
    return res.json();
  }

  private mapMethod(m: InitiatePaymentRequest['method']): string {
    return { momo: 'MOMO', zalopay: 'ZALOPAY', vnpay: 'VNPAY', card: 'CARD', bank_transfer: 'BANK' }[m];
  }

  private unmapMethod(m: string | undefined): ParsedWebhookEvent['method'] {
    if (!m) return undefined;
    return ({ MOMO: 'momo', ZALOPAY: 'zalopay', VNPAY: 'vnpay', CARD: 'card', BANK: 'bank_transfer' } as Record<string, ParsedWebhookEvent['method']>)[m];
  }

  private mapStatus(status: string | number | undefined, errorCode: string | undefined): ParsedWebhookEvent['status'] {
    if (status === 5 || status === '5' || status === 'success') return 'success';
    if (errorCode && errorCode !== '0') return 'failed';
    if (status === 'pending') return 'pending';
    return 'failed';
  }
}
