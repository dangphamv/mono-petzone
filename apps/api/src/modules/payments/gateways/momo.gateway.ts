import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type {
  PaymentGateway,
  InitiateRequest,
  InitiateResult,
  RefundRequest,
  RefundResult,
  ParsedWebhookEvent,
  WebhookKind,
} from './gateway.interface';

/**
 * MoMo AIO v2 — captureWallet (one-time payment).
 * Reference: github.com/momo-wallet/payment/blob/master/nodejs/MoMo.js
 * Docs: developers.momo.vn
 *
 * Sandbox public test creds (good for local dev without merchant signup):
 *   partnerCode=MOMO accessKey=F8BBA842ECF85 secretKey=K951B6PE1waDMi640xX08PD3vg6EkVlz
 *
 * orderId convention: we pass `payment_id` (UUID) as MoMo orderId so the IPN
 * round-trips it back and we can look up the local row directly.
 */
@Injectable()
export class MomoGateway implements PaymentGateway {
  readonly name = 'momo' as const;
  private readonly logger = new Logger(MomoGateway.name);
  private readonly endpoint: string;
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly partnerName: string;
  private readonly storeId: string;

  constructor(config: ConfigService) {
    this.endpoint = config.get<string>('MOMO_ENDPOINT') ?? 'https://test-payment.momo.vn';
    this.partnerCode = config.get<string>('MOMO_PARTNER_CODE') ?? '';
    this.accessKey = config.get<string>('MOMO_ACCESS_KEY') ?? '';
    this.secretKey = config.get<string>('MOMO_SECRET_KEY') ?? '';
    this.partnerName = config.get<string>('MOMO_PARTNER_NAME') ?? 'PetZone';
    this.storeId = config.get<string>('MOMO_STORE_ID') ?? 'PetZone';
    if (!this.partnerCode || !this.accessKey || !this.secretKey) {
      this.logger.warn('MoMo credentials missing; live calls will fail until set');
    }
  }

  async initiate(req: InitiateRequest): Promise<InitiateResult> {
    const orderId = req.payment_id;
    // MoMo requires requestId to be unique per call; reuse orderId is fine
    // because each retry creates a fresh `payments` row → fresh payment_id.
    const requestId = orderId;
    const amount = String(req.amount);
    const orderInfo = req.description;
    // Pass real order_id through extraData so the web bounce page can deeplink
    // to petzone://orders/{order_id} (app team's standard pattern). MoMo
    // echoes extraData back in both redirect URL query + IPN body.
    const extraData = req.order_id;
    const requestType = 'captureWallet';

    const rawSignature =
      `accessKey=${this.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${req.ipn_url}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${this.partnerCode}` +
      `&redirectUrl=${req.return_url}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;
    const signature = createHmac('sha256', this.secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode: this.partnerCode,
      partnerName: this.partnerName,
      storeId: this.storeId,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: req.return_url,
      ipnUrl: req.ipn_url,
      lang: 'vi',
      extraData,
      requestType,
      signature,
    };

    const res = await fetch(`${this.endpoint}/v2/gateway/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`MoMo create ${res.status}: ${text}`);
      throw new ServiceUnavailableException(`MoMo initiate HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      resultCode?: number;
      message?: string;
      payUrl?: string;
      qrCodeUrl?: string;
      deeplink?: string;
      orderId?: string;
    };
    if (data.resultCode !== 0 || !data.payUrl) {
      this.logger.error(`MoMo create resultCode=${data.resultCode} message=${data.message}`);
      throw new ServiceUnavailableException(
        `MoMo initiate failed: ${data.message ?? 'no payUrl'}`,
      );
    }
    return {
      redirect_url: data.payUrl,
      gateway_order_id: data.orderId ?? orderId,
      qr_code_url: data.qrCodeUrl,
      deeplink: data.deeplink,
      raw: data,
    };
  }

  async refund(req: RefundRequest): Promise<RefundResult> {
    const orderId = req.refund_request_id;
    const requestId = orderId;
    const amount = String(req.amount);
    const description = req.reason;
    const transId = req.gateway_transaction_id;

    const rawSignature =
      `accessKey=${this.accessKey}` +
      `&amount=${amount}` +
      `&description=${description}` +
      `&orderId=${orderId}` +
      `&partnerCode=${this.partnerCode}` +
      `&requestId=${requestId}` +
      `&transId=${transId}`;
    const signature = createHmac('sha256', this.secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode: this.partnerCode,
      orderId,
      requestId,
      amount,
      transId,
      lang: 'vi',
      description,
      signature,
    };

    const res = await fetch(`${this.endpoint}/v2/gateway/api/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`MoMo refund ${res.status}: ${text}`);
      throw new ServiceUnavailableException(`MoMo refund HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      resultCode?: number;
      message?: string;
      transId?: number | string;
    };
    if (data.resultCode !== 0) {
      this.logger.error(`MoMo refund resultCode=${data.resultCode} message=${data.message}`);
      throw new ServiceUnavailableException(`MoMo refund failed: ${data.message ?? 'unknown'}`);
    }
    return {
      gateway_refund_id: String(data.transId ?? orderId),
      raw: data,
    };
  }

  /**
   * Verify the HMAC-SHA256 signature on a MoMo IPN body.
   * Field order for collection IPN (from MoMo docs §IPN):
   *   accessKey, amount, extraData, message, orderId, orderInfo, orderType,
   *   partnerCode, payType, requestId, responseTime, resultCode, transId
   * Refund IPN drops payType/orderType and adds nothing — we sign whatever
   * MoMo includes in the body in their documented order.
   */
  verifyWebhookSignature(body: Record<string, unknown>, _headers: Record<string, string> = {}): boolean {
    const sig = body.signature as string | undefined;
    if (!sig || !this.secretKey) return false;

    const isRefund = body.transId == null && (body.refundTrans != null || body.refundId != null);
    const raw = isRefund
      ? this.buildRefundIpnRaw(body)
      : this.buildCollectionIpnRaw(body);
    const expected = createHmac('sha256', this.secretKey).update(raw).digest('hex');
    try {
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(sig, 'hex');
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  detectWebhookKind(body: Record<string, unknown>): WebhookKind {
    if (body.refundTrans != null || body.refundId != null) return 'refund';
    return 'collection';
  }

  parseWebhook(body: Record<string, unknown>, kind: WebhookKind): ParsedWebhookEvent {
    const resultCode = Number(body.resultCode ?? -1);
    const status: ParsedWebhookEvent['status'] = resultCode === 0 ? 'success' : 'failed';
    const paymentId = String(body.orderId ?? '');
    if (kind === 'refund') {
      return {
        kind: 'refund',
        event_id: String(body.refundTrans ?? body.refundId ?? body.requestId ?? ''),
        payment_id: paymentId,
        status,
        amount: body.amount != null ? Number(body.amount) : undefined,
        failure_reason: resultCode === 0 ? undefined : String(body.message ?? `resultCode=${resultCode}`),
        raw: body,
      };
    }
    return {
      kind: 'collection',
      event_id: String(body.transId ?? body.requestId ?? ''),
      payment_id: paymentId,
      gateway_transaction_id: body.transId != null ? String(body.transId) : undefined,
      status,
      amount: body.amount != null ? Number(body.amount) : undefined,
      failure_reason: resultCode === 0 ? undefined : String(body.message ?? `resultCode=${resultCode}`),
      raw: body,
    };
  }

  private buildCollectionIpnRaw(body: Record<string, unknown>): string {
    return (
      `accessKey=${this.accessKey}` +
      `&amount=${body.amount ?? ''}` +
      `&extraData=${body.extraData ?? ''}` +
      `&message=${body.message ?? ''}` +
      `&orderId=${body.orderId ?? ''}` +
      `&orderInfo=${body.orderInfo ?? ''}` +
      `&orderType=${body.orderType ?? ''}` +
      `&partnerCode=${body.partnerCode ?? ''}` +
      `&payType=${body.payType ?? ''}` +
      `&requestId=${body.requestId ?? ''}` +
      `&responseTime=${body.responseTime ?? ''}` +
      `&resultCode=${body.resultCode ?? ''}` +
      `&transId=${body.transId ?? ''}`
    );
  }

  private buildRefundIpnRaw(body: Record<string, unknown>): string {
    return (
      `accessKey=${this.accessKey}` +
      `&amount=${body.amount ?? ''}` +
      `&message=${body.message ?? ''}` +
      `&orderId=${body.orderId ?? ''}` +
      `&partnerCode=${body.partnerCode ?? ''}` +
      `&requestId=${body.requestId ?? ''}` +
      `&responseTime=${body.responseTime ?? ''}` +
      `&resultCode=${body.resultCode ?? ''}` +
      `&transId=${body.transId ?? ''}`
    );
  }
}
