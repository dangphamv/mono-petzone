export type PspProvider = '9pay' | 'mock'

export type PaymentV2Method = 'momo' | 'zalopay' | 'vnpay' | 'card' | 'bank_transfer'

export type PaymentV2Status =
  | 'awaiting_payment'
  | 'captured'
  | 'split_pending'
  | 'split_completed'
  | 'split_failed'
  | 'refunded'

export type PayoutV2Recipient = 'provider' | 'petzone'

export type PayoutV2Status = 'pending' | 'dispatched' | 'completed' | 'failed'

export type OutboxV2Kind = 'disburse_provider' | 'disburse_petzone' | 'refund'

export type OutboxV2Status = 'pending' | 'dispatched' | 'completed' | 'failed'

export interface PaymentV2 {
  id: string
  order_id: string
  owner_id: string
  provider_id: string
  amount: number
  currency: 'VND'
  psp_provider: PspProvider
  psp_order_id: string
  psp_payment_url: string | null
  method: PaymentV2Method | null
  status: PaymentV2Status
  captured_at: string | null
  split_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ProviderPayoutV2 {
  id: string
  payment_v2_id: string
  provider_id: string
  recipient: PayoutV2Recipient
  gross_amount: number
  commission_rate: number
  commission_amount: number
  net_amount: number
  bank_account_snapshot: BankAccountSnapshot
  psp_disbursement_id: string | null
  status: PayoutV2Status
  failure_reason: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface BankAccountSnapshot {
  bank_name: string
  account_number_masked: string
  account_holder: string
}

export const PAYMENT_V2_STATUS_LABELS: Record<PaymentV2Status, string> = {
  awaiting_payment: 'Chờ thanh toán',
  captured: 'PSP đã giữ tiền',
  split_pending: 'Đang chia tiền',
  split_completed: 'Đã chia tiền',
  split_failed: 'Chia tiền thất bại',
  refunded: 'Đã hoàn tiền',
}

export const PAYOUT_V2_STATUS_LABELS: Record<PayoutV2Status, string> = {
  pending: 'Chờ xử lý',
  dispatched: 'Đã gửi PSP',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
}
