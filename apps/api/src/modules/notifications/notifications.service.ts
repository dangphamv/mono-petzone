import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { RegisterDeviceTokenInput } from '@petzone/validators';
import { SupabaseService } from '../supabase/supabase.service';
import { FcmService, type FcmPayload } from '../fcm/fcm.service';
import { NOTIFICATION_COLUMNS, DEVICE_TOKEN_COLUMNS } from '../../common/constants/columns';
import { paginate, type PaginationParams } from '../../common/utils/pagination';

export type NotificationType =
  | 'order_status'
  | 'new_message'
  | 'status_report'
  | 'payment'
  | 'emergency'
  | 'review'
  | 'verification'
  | 'reminder_report'
  | 'reminder_review'
  | 'system'
  | 'promotion';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  /** Structured data persisted to notifications.data + flattened to FCM data (strings). */
  data?: Record<string, unknown>;
  /** Deep-link route the app opens when user taps. Stored in data.click_action. */
  clickAction?: string;
  imageUrl?: string;
}

interface DeviceTokenRow {
  id: string;
  token: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly fcm: FcmService,
  ) {}

  // ─────────────────────────── Send (high-level) ───────────────────────────

  /**
   * Persist a notification + fan out via FCM to all active devices of the
   * user. Invalid tokens are auto-deactivated. Use this anywhere a domain
   * event should reach a user — not just payments.
   *
   * Returns the persisted notification row (always), even if push fails.
   */
  async sendToUser(userId: string, payload: NotificationPayload) {
    const notification = await this.persistNotification(userId, payload);
    await this.pushToUserTokens(userId, notification.id, payload);
    return notification;
  }

  /**
   * Fanout to many users in parallel. Each gets their own notification row.
   */
  async sendToUsers(userIds: string[], payload: NotificationPayload) {
    const uniq = Array.from(new Set(userIds.filter(Boolean)));
    if (!uniq.length) return [];
    return Promise.all(uniq.map((id) => this.sendToUser(id, payload)));
  }

  /**
   * Push-only (no DB persist). Use when the message is purely transactional
   * and there's no need to show it in the in-app notification center.
   */
  async pushOnly(userId: string, payload: NotificationPayload) {
    await this.pushToUserTokens(userId, null, payload);
  }

  private async persistNotification(userId: string, payload: NotificationPayload) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .insert({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? null,
        is_read: false,
        push_sent: false,
      })
      .select(NOTIFICATION_COLUMNS)
      .single();
    if (error) {
      this.logger.error(`persist notification failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  private async pushToUserTokens(
    userId: string,
    notificationId: string | null,
    payload: NotificationPayload,
  ) {
    const { data: tokenRows } = await this.supabase.client
      .from('device_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('is_active', true);
    const tokens = (tokenRows as DeviceTokenRow[] | null) ?? [];
    if (!tokens.length) return;

    const fcmPayload: FcmPayload = {
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
      clickAction: payload.clickAction,
      data: this.buildFcmData(payload, notificationId),
    };

    const result = await this.fcm.sendToTokens(
      tokens.map((t) => t.token),
      fcmPayload,
    );

    // Deactivate dead tokens so we don't retry them next time.
    if (result.invalidTokens.length) {
      await this.supabase.client
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .in('token', result.invalidTokens);
      this.logger.log(`Deactivated ${result.invalidTokens.length} invalid token(s) for user ${userId}`);
    }

    if (notificationId) {
      await this.supabase.client
        .from('notifications')
        .update({ push_sent: result.successful.length > 0 })
        .eq('id', notificationId);

      // Per-token delivery log
      const logRows = [
        ...result.successful.map((token) => ({ token, status: 'sent' })),
        ...result.invalidTokens.map((token) => ({ token, status: 'failed' })),
        ...result.retryableTokens.map((token) => ({ token, status: 'failed' })),
      ];
      if (logRows.length) {
        await this.supabase.client.from('notification_delivery_log').insert(
          logRows.map((r) => ({
            notification_id: notificationId,
            channel: 'push',
            status: r.status,
            provider_response: { token_suffix: r.token.slice(-8) },
          })),
        );
      }
    }
  }

  /** FCM data field must be Record<string,string>. Stringify everything. */
  private buildFcmData(
    payload: NotificationPayload,
    notificationId: string | null,
  ): Record<string, string> {
    const data: Record<string, string> = {
      type: payload.type,
    };
    if (notificationId) data.notification_id = notificationId;
    if (payload.clickAction) data.click_action = payload.clickAction;
    if (payload.data) {
      for (const [k, v] of Object.entries(payload.data)) {
        if (v == null) continue;
        data[k] = typeof v === 'string' ? v : JSON.stringify(v);
      }
    }
    return data;
  }

  // ─────────────────────────── User-facing CRUD ───────────────────────────

  async findAll(userId: string, params: PaginationParams) {
    const { page = 1, limit = 20 } = params;
    const from = (page - 1) * limit;

    const { data, error, count } = await this.supabase.client
      .from('notifications')
      .select(NOTIFICATION_COLUMNS, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new BadRequestException(error.message);

    return paginate(data ?? [], count ?? 0, { page, limit });
  }

  async markRead(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select(NOTIFICATION_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('Notification not found');

    return data;
  }

  async markAllRead(userId: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select(NOTIFICATION_COLUMNS);
    if (error) throw new BadRequestException(error.message);

    return { count: data?.length || 0 };
  }

  async registerDeviceToken(userId: string, body: RegisterDeviceTokenInput) {
    const { data, error } = await this.supabase.client
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          token: body.token,
          platform: body.platform,
          is_active: true,
        },
        { onConflict: 'user_id,token' },
      )
      .select(DEVICE_TOKEN_COLUMNS)
      .single();
    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async remove(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single();
    if (error || !data) throw new NotFoundException('Notification not found');

    return { message: 'Notification deleted' };
  }

  async removeDeviceToken(userId: string, token: string) {
    const { data, error } = await this.supabase.client
      .from('device_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token)
      .select(DEVICE_TOKEN_COLUMNS)
      .single();
    if (error || !data) throw new NotFoundException('Device token not found');

    return data;
  }
}
