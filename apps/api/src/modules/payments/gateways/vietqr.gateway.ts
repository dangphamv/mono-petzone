import {
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type {
  PaymentGateway,
  InitiateRequest,
  InitiateResult,
  RefundRequest,
  RefundResult,
  ParsedWebhookEvent,
  WebhookKind,
  BankInfo,
} from './gateway.interface';
import { VIETQR_BANK_CODES, normalizeBankBrand } from './vietqr-banks';

/**
 * VietQR direct-to-provider. PetZone doesn't collect money — owner scans
 * the QR with their bank app and transfers straight to the provider's
 * account. Confirmation comes from a bank-listening service (SePay) which
 * POSTs a webhook to /api/payments/callback/vietqr.
 *
 * initiate(): builds a Napas-standard QR URL via img.vietqr.io. No external
 *             API call — the URL itself encodes amount + transfer memo.
 * verify():   SePay signs with `Authorization: Apikey <SEPAY_API_KEY>`.
 *             No body signature. Constant-time compare.
 * parse():    matches the inbound bank tx to a payment by extracting the
 *             order_number (e.g. PB-20260516-0001) from the transfer memo.
 */
@Injectable()
export class VietQRGateway implements PaymentGateway {
  readonly name = 'vietqr' as const;
  private readonly logger = new Logger(VietQRGateway.name);
  private readonly sepayApiKey: string;
  private readonly qrTemplate: string;

  constructor(config: ConfigService) {
    this.sepayApiKey = config.get<string>('SEPAY_API_KEY') ?? '';
    this.qrTemplate = config.get<string>('VIETQR_TEMPLATE') ?? 'compact2';
    if (!this.sepayApiKey) {
      this.logger.warn('SEPAY_API_KEY not set; webhook signature checks will reject all events');
    }
  }

  async initiate(req: InitiateRequest): Promise<InitiateResult> {
    const bank = req.provider_bank;
    if (!bank) {
      throw new NotImplementedException(
        'VietQR initiate requires provider bank info passed by PaymentsService',
      );
    }
    const bankCode = normalizeBankBrand(bank.bank_name);
    if (!bankCode) {
      throw new NotImplementedException(
        `VietQR: unsupported bank "${bank.bank_name}". Add to vietqr-banks.ts`,
      );
    }
    const accountNumber = bank.account_number.replace(/\s+/g, '');
    const content = bank.content;
    const amount = bank.amount;
    const accountHolder = bank.account_holder;

    const qs = new URLSearchParams({
      amount: String(amount),
      addInfo: content,
      accountName: accountHolder,
    });
    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-${this.qrTemplate}.png?${qs.toString()}`;

    return {
      redirect_url: '',
      gateway_order_id: req.payment_id,
      qr_code_url: qrUrl,
      bank_info: {
        bank_name: bank.bank_name,
        account_number: accountNumber,
        account_holder: accountHolder,
        content,
        amount,
      },
      raw: { qr_url: qrUrl, bank_code: bankCode },
    };
  }

  refund(_req: RefundRequest): Promise<RefundResult> {
    // VietQR is a direct provider→owner transfer outside PetZone. We can't
    // auto-refund — admin must coordinate with the provider to send funds back.
    throw new NotImplementedException(
      'VietQR refund is manual. Admin must coordinate refund directly with the provider.',
    );
  }

  verifyWebhookSignature(_body: Record<string, unknown>, headers: Record<string, string>): boolean {
    if (!this.sepayApiKey) return false;
    const authHeader = headers['authorization'] ?? headers['Authorization'] ?? '';
    const match = /^Apikey\s+(.+)$/i.exec(authHeader.trim());
    if (!match) return false;
    const provided = match[1];
    try {
      const a = Buffer.from(provided);
      const b = Buffer.from(this.sepayApiKey);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  detectWebhookKind(_body: Record<string, unknown>): WebhookKind {
    // SePay only sends collection events for incoming transfers.
    // Outgoing/refund tracking is out of scope.
    return 'collection';
  }

  parseWebhook(body: Record<string, unknown>, _kind: WebhookKind): ParsedWebhookEvent {
    const content = String(body.content ?? '');
    const code = body.code != null ? String(body.code) : '';
    const orderNumber = this.extractOrderNumber(code || content);

    const transferType = String(body.transferType ?? '');
    const amount = body.transferAmount != null ? Number(body.transferAmount) : undefined;
    const eventId = String(body.id ?? body.referenceCode ?? '');

    return {
      kind: 'collection',
      event_id: eventId,
      // payment_id is resolved by PaymentsService via order_number lookup;
      // we surface order_number through gateway_transaction_id for now.
      payment_id: '',
      gateway_transaction_id: orderNumber || undefined,
      status: transferType === 'in' && amount && amount > 0 ? 'success' : 'failed',
      amount,
      failure_reason: transferType !== 'in' ? `transferType=${transferType}` : undefined,
      raw: body,
    };
  }

  /**
   * Order number format: PB-YYYYMMDD-NNNN (e.g. PB-20260516-0001).
   * Owners may type extra words around it. Take the first match.
   */
  private extractOrderNumber(text: string): string | null {
    const m = /PB-\d{8}-\d{4}/.exec(text);
    return m ? m[0] : null;
  }
}

/** Re-export so app code can introspect supported banks. */
export { VIETQR_BANK_CODES };
