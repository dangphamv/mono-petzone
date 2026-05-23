import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '@petzone/shared';
import type {
  PaymentCompletedPayload,
  PaymentFailedPayload,
  PaymentCashPendingPayload,
  OrderActorPayload,
  OrderCancelledPayload,
  OrderDeclinedPayload,
} from '@petzone/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from './notifications.service';

/**
 * Domain-event → notification bridge.
 *
 * Producers (PaymentsService, OrdersService, ChatService) emit events
 * defined in `@petzone/shared` NOTIFICATION_EVENTS; this listener translates
 * them into user-facing notifications. Adding a new notification = adding
 * one @OnEvent handler here, not sprinkling notification calls throughout
 * business logic.
 *
 * Event payload contracts are defined in @petzone/shared/types/notification.
 */
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly supabase: SupabaseService,
  ) {}

  // ─────────────────────────── Payment events ───────────────────────────

  @OnEvent(NOTIFICATION_EVENTS.PAYMENT_COMPLETED, { async: true })
  async onPaymentCompleted(payload: PaymentCompletedPayload) {
    const fmtAmount = new Intl.NumberFormat('vi-VN').format(payload.amount);

    await this.notifications.sendToUser(payload.owner_id, {
      type: 'payment',
      title: 'Đã nhận thanh toán ✅',
      body: `Đơn ${payload.order_number} (${fmtAmount}đ) — đang chờ chủ hotel xác nhận.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        amount: payload.amount,
        gateway: payload.gateway,
        event: NOTIFICATION_EVENTS.PAYMENT_COMPLETED,
      },
    });

    if (payload.provider_user_id) {
      await this.notifications.sendToUser(payload.provider_user_id, {
        type: 'payment',
        title: 'Đơn mới đã thanh toán 💰',
        body: `Đơn ${payload.order_number} đã thanh toán ${fmtAmount}đ. Vui lòng xác nhận trong 4 giờ.`,
        clickAction: `petzone://provider-orders/${payload.order_id}`,
        data: {
          order_id: payload.order_id,
          order_number: payload.order_number,
          amount: payload.amount,
          event: NOTIFICATION_EVENTS.PAYMENT_COMPLETED,
        },
      });
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.PAYMENT_FAILED, { async: true })
  async onPaymentFailed(payload: PaymentFailedPayload) {
    await this.notifications.sendToUser(payload.owner_id, {
      type: 'payment',
      title: 'Thanh toán không thành công',
      body: `Đơn ${payload.order_number} chưa thanh toán được${payload.reason ? `: ${payload.reason}` : ''}. Vui lòng thử lại.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.PAYMENT_FAILED,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PAYMENT_CASH_PENDING, { async: true })
  async onCashPending(payload: PaymentCashPendingPayload) {
    const fmtAmount = new Intl.NumberFormat('vi-VN').format(payload.amount);
    await this.notifications.sendToUser(payload.provider_user_id, {
      type: 'payment',
      title: 'Đơn mới — Thanh toán tiền mặt 💵',
      body: `Đơn ${payload.order_number ?? ''} (${fmtAmount}đ). Nhớ thu tiền mặt khi check-in.`,
      clickAction: `petzone://provider-orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number ?? '',
        amount: payload.amount,
        event: NOTIFICATION_EVENTS.PAYMENT_CASH_PENDING,
      },
    });
  }

  // ─────────────────────────── Order events ───────────────────────────

  @OnEvent(NOTIFICATION_EVENTS.ORDER_CREATED, { async: true })
  async onOrderCreated(payload: OrderActorPayload) {
    await this.notifications.sendToUser(payload.owner_id, {
      type: 'order_status',
      title: 'Đặt phòng thành công 🎉',
      body: `Đơn ${payload.order_number} đã được tạo. Vui lòng hoàn tất thanh toán để giữ chỗ.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.ORDER_CREATED,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.ORDER_CONFIRMED, { async: true })
  async onOrderConfirmed(payload: OrderActorPayload) {
    await this.notifications.sendToUser(payload.owner_id, {
      type: 'order_status',
      title: 'Chủ hotel đã xác nhận 🎉',
      body: `Đơn ${payload.order_number} đã được xác nhận. Bạn có thể gửi pet đúng lịch.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.ORDER_CONFIRMED,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.ORDER_DECLINED, { async: true })
  async onOrderDeclined(payload: OrderDeclinedPayload) {
    await this.notifications.sendToUser(payload.owner_id, {
      type: 'order_status',
      title: 'Đơn bị từ chối',
      body: `Đơn ${payload.order_number} đã bị chủ hotel từ chối${payload.reason ? `: ${payload.reason}` : ''}.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.ORDER_DECLINED,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.ORDER_CANCELLED, { async: true })
  async onOrderCancelled(payload: OrderCancelledPayload) {
    const targets: string[] = [];
    // Notify the counterparty (not the canceller)
    if (payload.cancelled_by !== 'owner') targets.push(payload.owner_id);
    if (payload.cancelled_by !== 'provider' && payload.provider_user_id) {
      targets.push(payload.provider_user_id);
    }
    if (!targets.length) return;

    await this.notifications.sendToUsers(targets, {
      type: 'order_status',
      title: 'Đơn đã hủy',
      body: `Đơn ${payload.order_number} đã bị hủy${payload.reason ? `: ${payload.reason}` : ''}.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.ORDER_CANCELLED,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.ORDER_CHECKED_IN, { async: true })
  async onCheckedIn(payload: OrderActorPayload) {
    await this.notifications.sendToUser(payload.owner_id, {
      type: 'order_status',
      title: 'Pet đã check-in 🐾',
      body: `Pet của bạn đã được nhận tại hotel. Hãy xem ảnh handoff trong app.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.ORDER_CHECKED_IN,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.ORDER_CHECK_OUT, { async: true })
  async onCheckOut(payload: OrderActorPayload) {
    await this.notifications.sendToUser(payload.owner_id, {
      type: 'order_status',
      title: 'Pet sẵn sàng được nhận về',
      body: `Đơn ${payload.order_number} đã check-out. Vui lòng xác nhận đã nhận pet trong app (tự động xác nhận sau 24h).`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.ORDER_CHECK_OUT,
      },
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.ORDER_COMPLETED, { async: true })
  async onOrderCompleted(payload: OrderActorPayload) {
    await this.notifications.sendToUser(payload.owner_id, {
      type: 'reminder_review',
      title: 'Đánh giá trải nghiệm',
      body: `Cảm ơn bạn đã sử dụng PetZone! Hãy chia sẻ trải nghiệm với chủ hotel.`,
      clickAction: `petzone://orders/${payload.order_id}`,
      data: {
        order_id: payload.order_id,
        order_number: payload.order_number,
        event: NOTIFICATION_EVENTS.ORDER_COMPLETED,
      },
    });
  }

  // ─────────────────────────── Chat ───────────────────────────

  /**
   * Subscribes to existing ChatService emit (chat.message.created).
   * Payload shape: { message, conversation } from chat.service.ts.
   * Resolves recipient (the other participant) + sender name then push.
   */
  @OnEvent(NOTIFICATION_EVENTS.CHAT_NEW_MESSAGE, { async: true })
  async onNewMessage(payload: {
    message: { id: string; sender_id: string; content: string | null; type: 'text' | 'image' };
    conversation: { id: string; owner_id: string; provider_id: string };
  }) {
    const { message, conversation } = payload;
    const recipientId =
      message.sender_id === conversation.owner_id ? conversation.provider_id : conversation.owner_id;
    if (!recipientId) return;

    // Lookup sender name for the notification title
    const { data: senderRow } = await this.supabase.client
      .from('users')
      .select('full_name')
      .eq('id', message.sender_id)
      .maybeSingle();
    const senderName = (senderRow as { full_name?: string } | null)?.full_name ?? 'Tin nhắn mới';

    const preview = message.type === 'image' ? '📷 Hình ảnh' : (message.content ?? '').slice(0, 120);

    // Use pushOnly — chat has its own history (chat_messages), no need to
    // duplicate in notifications table.
    await this.notifications.pushOnly(recipientId, {
      type: 'new_message',
      title: senderName,
      body: preview,
      clickAction: `petzone://chat/${conversation.id}`,
      data: {
        conversation_id: conversation.id,
        sender_id: message.sender_id,
        event: NOTIFICATION_EVENTS.CHAT_NEW_MESSAGE,
      },
    });
  }
}
