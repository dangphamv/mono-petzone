import { z } from 'zod'

export const verifyProviderSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().max(1000).optional(),
})

export const requestInfoSchema = z.object({
  requirements: z.string().min(1).max(1000),
})

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(1).max(2000),
  refund_amount: z.number().min(0).optional(),
})

export const suspendUserSchema = z.object({
  reason: z.string().min(1).max(500),
  is_permanent: z.boolean().default(false),
})

export const moderateReviewSchema = z.object({
  action: z.enum(['hide', 'show']),
  reason: z.string().max(500).optional(),
})

export type VerifyProviderInput = z.infer<typeof verifyProviderSchema>
export type RequestInfoInput = z.infer<typeof requestInfoSchema>
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>
export type SuspendUserInput = z.infer<typeof suspendUserSchema>
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>

export const updateConfigSchema = z.object({
  commission_rate: z.number().min(0).max(1).optional(),
  auto_confirm_hours: z.number().int().positive().optional(),
  payment_timeout_hours: z.number().int().positive().optional(),
})

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>
