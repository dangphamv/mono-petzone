import { z } from 'zod'

export const initiatePaymentV2Schema = z.object({
  order_id: z.string().uuid(),
  method: z.enum(['momo', 'zalopay', 'vnpay', 'card', 'bank_transfer']),
  return_url: z.string().url().optional(),
})

export const refundV2Schema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(1).max(500),
})

// PSP webhooks are loosely typed (provider-specific). Signature is verified
// before parsing; payload shape is normalized inside the provider impl.
export const pspWebhookSchema = z.record(z.string(), z.unknown())

export type InitiatePaymentV2Input = z.infer<typeof initiatePaymentV2Schema>
export type RefundV2Input = z.infer<typeof refundV2Schema>

// Bank info — required before admin approval of provider verification
export const updateProviderBankSchema = z.object({
  bank_name: z.string().trim().min(2).max(100),
  bank_account_number: z.string().trim().regex(/^\d{6,20}$/, 'Bank account number must be 6-20 digits'),
  bank_account_holder: z.string().trim().min(2).max(200),
})

export type UpdateProviderBankInput = z.infer<typeof updateProviderBankSchema>
