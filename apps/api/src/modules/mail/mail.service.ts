import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

/**
 * Transactional email via SendGrid. No-op (logs a warning) when SENDGRID_API_KEY is
 * unset so local/dev boots without credentials — mirrors FcmService behaviour.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly enabled: boolean;
  private readonly from: { email: string; name: string };

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    this.from = {
      email: this.config.get<string>('SENDGRID_FROM_EMAIL') ?? 'noreply@petzone.com',
      name: this.config.get<string>('SENDGRID_FROM_NAME') ?? 'PetZone',
    };
    this.enabled = Boolean(apiKey);
    if (this.enabled) {
      sgMail.setApiKey(apiKey as string);
      this.logger.log('SendGrid mail enabled');
    } else {
      this.logger.warn('SENDGRID_API_KEY not set — emails are logged, not sent');
    }
  }

  async sendPasswordReset(to: string, resetUrl: string, fullName?: string): Promise<void> {
    const name = fullName?.trim() || to;
    const subject = 'Đặt lại mật khẩu PetZone';
    const text = `Xin chào ${name},\n\nBạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản PetZone.\nNhấp vào liên kết sau để đặt lại (hết hạn sau 1 giờ):\n\n${resetUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
        <h2 style="color:#2DD4BF">Đặt lại mật khẩu PetZone</h2>
        <p>Xin chào <strong>${escapeHtml(name)}</strong>,</p>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản PetZone.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#2DD4BF;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600">Đặt lại mật khẩu</a>
        </p>
        <p style="color:#6b7280;font-size:13px">Liên kết hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        <p style="color:#9ca3af;font-size:12px;word-break:break-all">Hoặc dán liên kết: ${resetUrl}</p>
      </div>`;

    if (!this.enabled) {
      this.logger.warn(`[mail:noop] password reset for ${to} → ${resetUrl}`);
      return;
    }
    try {
      await sgMail.send({ to, from: this.from, subject, text, html });
    } catch (err) {
      // Don't leak which emails exist / fail upstream; log and swallow.
      this.logger.error(`Failed to send password reset email to ${to}: ${(err as Error).message}`);
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
