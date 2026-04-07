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
  | 'promotion'

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
