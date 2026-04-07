export type OrderStatus =
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'check_out'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type CancelledBy = 'owner' | 'provider' | 'system'

export interface Order {
  id: string
  order_number: string
  owner_id: string
  provider_id: string
  room_type_id: string
  status: OrderStatus
  check_in_date: string
  check_out_date: string
  num_nights: number
  pet_ids: string[]
  add_on_ids: string[]
  special_notes?: string
  daily_status_report: boolean
  price_breakdown: PriceBreakdown
  total_price: number
  cancellation_policy: string
  provider_response_deadline?: string
  cancelled_at?: string
  cancelled_by?: CancelledBy
  cancellation_reason?: string
  refund_amount?: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface PriceBreakdown {
  room_price: number
  num_nights: number
  room_subtotal: number
  add_ons: { name: string; price: number; quantity: number }[]
  add_ons_subtotal: number
  service_subtotal: number
  platform_fee_rate: number
  platform_fee: number
  total: number
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  actor_id?: string
  actor_type: 'owner' | 'provider' | 'admin' | 'system'
  note?: string
  created_at: string
}
