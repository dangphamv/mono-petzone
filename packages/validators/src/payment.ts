import { z } from 'zod'

export const createPaymentSchema = z.object({
  order_id: z.string().uuid(),
  method: z.enum(['momo', 'zalopay', 'vnpay', 'bank_transfer']),
  return_url: z.string().url().optional(),
})

export const refundSchema = z.object({
  order_id: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(1).max(500),
  type: z.enum(['full', 'partial']),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type RefundInput = z.infer<typeof refundSchema>
