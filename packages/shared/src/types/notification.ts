/**
 * Notification system enums + types.
 * Shared between backend (NestJS) and mobile app (via API contract).
 *
 * Adding a new notification = (1) add to NOTIFICATION_EVENTS if new event,
 * (2) add handler in NotificationsListener, (3) optionally add to
 * NOTIFICATION_TYPES if new visual category.
 */

// ─────────────────────────── NotificationType (visual category) ───────────────────────────

/**
 * Visual/UX category — app uses this to pick icon, sound, badge color.
 * Stored in `notifications.type` column (DB enum check constraint).
 */
export const NOTIFICATION_TYPES = [
  'order_status',
  'new_message',
  'status_report',
  'payment',
  'emergency',
  'review',
  'verification',
  'reminder_report',
  'reminder_review',
  'system',
  'promotion',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

/** Vietnamese labels for each type — for admin dashboard, debug screens. */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_status: 'Trạng thái đơn hàng',
  new_message: 'Tin nhắn mới',
  status_report: 'Báo cáo daily',
  payment: 'Thanh toán',
  emergency: 'Khẩn cấp',
  review: 'Đánh giá',
  verification: 'Xác minh tài khoản',
  reminder_report: 'Nhắc gửi báo cáo',
  reminder_review: 'Nhắc viết đánh giá',
  system: 'Hệ thống',
  promotion: 'Khuyến mãi',
}

// ─────────────────────────── NotificationEvent (semantic trigger) ───────────────────────────

/**
 * Domain events that trigger notifications. Producers emit these via
 * EventEmitter2; NotificationsListener subscribes and fans out push.
 *
 * Naming convention: `<domain>.<verb_past_tense>` (e.g. `payment.completed`).
 * Strings are stable — don't rename; only add new ones.
 */
export const NOTIFICATION_EVENTS = {
  // Payment domain
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_CASH_PENDING: 'payment.cash_pending',

  // Order domain
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_DECLINED: 'order.declined',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_CHECKED_IN: 'order.checked_in',
  ORDER_CHECK_OUT: 'order.check_out',
  ORDER_COMPLETED: 'order.completed',

  // Chat domain — re-uses existing ChatService emit name
  CHAT_NEW_MESSAGE: 'chat.message.created',
} as const

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS]

/** Map every event → which NotificationType it produces. For docs/swagger. */
export const NOTIFICATION_EVENT_TYPE_MAP: Record<NotificationEvent, NotificationType> = {
  [NOTIFICATION_EVENTS.PAYMENT_COMPLETED]: 'payment',
  [NOTIFICATION_EVENTS.PAYMENT_FAILED]: 'payment',
  [NOTIFICATION_EVENTS.PAYMENT_CASH_PENDING]: 'payment',
  [NOTIFICATION_EVENTS.ORDER_CONFIRMED]: 'order_status',
  [NOTIFICATION_EVENTS.ORDER_DECLINED]: 'order_status',
  [NOTIFICATION_EVENTS.ORDER_CANCELLED]: 'order_status',
  [NOTIFICATION_EVENTS.ORDER_CHECKED_IN]: 'order_status',
  [NOTIFICATION_EVENTS.ORDER_CHECK_OUT]: 'order_status',
  [NOTIFICATION_EVENTS.ORDER_COMPLETED]: 'reminder_review',
  [NOTIFICATION_EVENTS.CHAT_NEW_MESSAGE]: 'new_message',
}

// ─────────────────────────── Event payload contracts ───────────────────────────

export interface PaymentCompletedPayload {
  owner_id: string
  provider_user_id?: string
  order_id: string
  order_number: string
  amount: number
  gateway: string
}

export interface PaymentFailedPayload {
  owner_id: string
  order_id: string
  order_number: string
  reason?: string
}

export interface PaymentCashPendingPayload {
  provider_user_id: string
  order_id: string
  order_number?: string | null
  amount: number
}

export interface OrderActorPayload {
  owner_id: string
  provider_user_id?: string
  order_id: string
  order_number: string
}

export interface OrderCancelledPayload extends OrderActorPayload {
  cancelled_by: 'owner' | 'provider' | 'admin' | 'system'
  reason?: string
}

export interface OrderDeclinedPayload extends OrderActorPayload {
  reason?: string
}

// ─────────────────────────── DB types ───────────────────────────

export type DevicePlatform = 'ios' | 'android' | 'web'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
  is_read: boolean
  push_sent: boolean
  created_at: string
  read_at?: string
}

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: DevicePlatform
  is_active: boolean
  created_at: string
  updated_at: string
}
