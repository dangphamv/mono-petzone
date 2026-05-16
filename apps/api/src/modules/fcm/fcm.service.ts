import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  initializeApp,
  cert,
  getApps,
  type App,
} from 'firebase-admin/app';
import { getMessaging, type Messaging, type Message, type BatchResponse } from 'firebase-admin/messaging';

export interface FcmPayload {
  title: string;
  body: string;
  /** FCM requires data values to be strings. Numbers/bools must be stringified. */
  data?: Record<string, string>;
  imageUrl?: string;
  /** Click action / deep link path (e.g. petzone://orders/123). */
  clickAction?: string;
}

export interface FcmSendResult {
  successful: string[];
  /** Tokens that FCM rejected (unregistered, invalid). Caller should mark them inactive. */
  invalidTokens: string[];
  /** Other errors (rate limit, server). Caller may retry. */
  retryableTokens: string[];
  raw?: BatchResponse;
}

/**
 * Firebase Cloud Messaging wrapper. One singleton App instance per process.
 *
 * Credentials are loaded from env vars (no service-account file on disk —
 * Railway-friendly):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (PEM with literal \n; we unescape)
 *
 * If any creds are missing, the service runs in NO-OP mode (logs warnings,
 * never throws). This keeps local dev simple and lets us deploy without
 * blocking on Firebase setup.
 */
@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: App | null = null;
  private messaging: Messaging | null = null;
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKeyRaw = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.warn(
        'FCM disabled — missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. Push notifications will no-op.',
      );
      return;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    const existing = getApps().find((a) => a.name === 'petzone');
    this.app =
      existing ??
      initializeApp(
        { credential: cert({ projectId, clientEmail, privateKey }) },
        'petzone',
      );
    this.messaging = getMessaging(this.app);
    this.enabled = true;
    this.logger.log(`FCM initialized for project ${projectId}`);
  }

  /**
   * Send to a single device. Returns invalid=true if FCM said the token is dead.
   */
  async sendToToken(token: string, payload: FcmPayload): Promise<{ ok: boolean; invalid: boolean; error?: string }> {
    if (!this.enabled || !this.messaging) return { ok: false, invalid: false, error: 'fcm_disabled' };
    try {
      await this.messaging.send(this.buildMessage(token, payload));
      return { ok: true, invalid: false };
    } catch (err) {
      const code = (err as { code?: string }).code;
      const invalid = isInvalidTokenError(code);
      const msg = (err as Error).message;
      if (!invalid) this.logger.error(`FCM send failed (${code}): ${msg}`);
      return { ok: false, invalid, error: msg };
    }
  }

  /**
   * Multi-device fanout. FCM batch limit is 500 tokens per call — we chunk.
   */
  async sendToTokens(tokens: string[], payload: FcmPayload): Promise<FcmSendResult> {
    const result: FcmSendResult = { successful: [], invalidTokens: [], retryableTokens: [] };
    if (!this.enabled || !this.messaging || !tokens.length) return result;

    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));

    for (const chunk of chunks) {
      try {
        const res = await this.messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
          data: payload.data,
          android: payload.clickAction
            ? { notification: { clickAction: payload.clickAction } }
            : undefined,
          apns: {
            payload: {
              aps: { sound: 'default', badge: 1 },
            },
          },
        });
        res.responses.forEach((r, idx) => {
          const token = chunk[idx];
          if (r.success) {
            result.successful.push(token);
          } else {
            const code = r.error?.code;
            if (isInvalidTokenError(code)) result.invalidTokens.push(token);
            else result.retryableTokens.push(token);
          }
        });
        result.raw = res;
      } catch (err) {
        this.logger.error(`FCM batch send failed: ${(err as Error).message}`);
        result.retryableTokens.push(...chunk);
      }
    }
    return result;
  }

  private buildMessage(token: string, payload: FcmPayload): Message {
    return {
      token,
      notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
      data: payload.data,
      android: payload.clickAction
        ? { notification: { clickAction: payload.clickAction } }
        : undefined,
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };
  }
}

/**
 * FCM error codes that mean "stop sending to this token — it's dead".
 * Source: firebase.google.com/docs/cloud-messaging/send-message#admin
 */
function isInvalidTokenError(code: string | undefined): boolean {
  if (!code) return false;
  return (
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-argument'
  );
}
