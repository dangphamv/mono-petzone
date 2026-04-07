export type PaymentMethod = 'momo' | 'zalopay' | 'vnpay' | 'bank_transfer'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'

export type EscrowType = 'hold' | 'release' | 'refund'

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  transaction_ref?: string
  gateway_response?: Record<string, unknown>
  paid_at?: string
  refunded_at?: string
  refund_amount?: number
  created_at: string
  updated_at: string
}

export interface EscrowEntry {
  id: string
  order_id: string
  type: EscrowType
  amount: number
  balance_after: number
  description?: string
  created_at: string
}

export interface ProviderPayout {
  id: string
  provider_id: string
  order_id: string
  gross_amount: number
  commission_rate: number
  commission_amount: number
  net_amount: number
  status: PayoutStatus
  payout_date?: string
  created_at: string
  updated_at: string
}
