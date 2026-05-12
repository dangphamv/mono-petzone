import { z } from 'zod'

export const verifyProviderSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  notes: z.string().max(1000).optional(),
})

export const adminUpdateProviderSchema = z.object({
  business_name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  license_number: z.string().trim().max(100).optional(),
  address: z.string().trim().min(5).max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  accepted_species: z.array(z.enum(['dog', 'cat', 'other'])).min(1).optional(),
  weight_limit_min_kg: z.number().positive().nullable().optional(),
  weight_limit_max_kg: z.number().positive().nullable().optional(),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict']).optional(),
  is_active: z.boolean().optional(),
})

export const adminCreateProviderSchema = z.object({
  // Either reference an existing user...
  user_id: z.string().uuid().optional(),
  // ...or create a new owner account inline.
  new_owner: z
    .object({
      full_name: z.string().trim().min(1).max(100),
      email: z.string().trim().email().optional(),
      phone: z.string().trim().min(8).max(15).optional(),
    })
    .optional(),
  business_name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  license_number: z.string().trim().max(100).optional(),
  address: z.string().trim().min(5).max(500),
  latitude: z.number().min(-90).max(90).default(10.7626),
  longitude: z.number().min(-180).max(180).default(106.6602),
  phone: z.string().trim().max(20).optional(),
  accepted_species: z.array(z.enum(['dog', 'cat', 'other'])).min(1).default(['dog', 'cat']),
  weight_limit_min_kg: z.number().positive().optional(),
  weight_limit_max_kg: z.number().positive().optional(),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict']).default('flexible'),
}).refine(
  (data) => (data.user_id ? 1 : 0) + (data.new_owner ? 1 : 0) === 1,
  { message: 'Provide either user_id or new_owner (not both)', path: ['user_id'] },
).refine(
  (data) => !data.new_owner || Boolean(data.new_owner.email || data.new_owner.phone),
  { message: 'new_owner must include either email or phone', path: ['new_owner'] },
)

export const requestInfoSchema = z.object({
  requirements: z.string().min(1).max(1000),
})

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(1).max(2000),
  refund_amount: z.number().min(0).optional(),
})

export const adminCreateDisputeSchema = z.object({
  order_id: z.string().uuid(),
  opened_by_role: z.enum(['owner', 'provider']),
  description: z.string().min(1).max(2000),
  evidence_photos: z.array(z.string().url()).max(10).default([]),
})

export const suspendUserSchema = z.object({
  reason: z.string().min(1).max(500),
  is_permanent: z.boolean().default(false),
})

export const moderateReviewSchema = z.object({
  action: z.enum(['hide', 'show']),
  reason: z.string().max(500).optional(),
})

export const adminCreatePetSchema = z.object({
  owner_id: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().trim().max(100).optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  date_of_birth: z.string().optional(),
  weight_kg: z.number().positive().max(200).optional(),
  color: z.string().max(50).optional(),
  photos: z.array(z.string().url()).max(10).default([]),
  is_neutered: z.enum(['yes', 'no', 'unknown']).default('unknown'),
  temperament: z.enum(['friendly', 'shy', 'aggressive', 'normal']).default('normal'),
  sociable_with_others: z.enum(['yes', 'no', 'depends']).default('depends'),
  special_needs_notes: z.string().max(1000).optional(),
})

export const adminUpdatePetSchema = adminCreatePetSchema.omit({ owner_id: true }).partial().extend({
  is_active: z.boolean().optional(),
})

export type VerifyProviderInput = z.infer<typeof verifyProviderSchema>
export type AdminUpdateProviderInput = z.infer<typeof adminUpdateProviderSchema>
export type AdminCreateProviderInput = z.infer<typeof adminCreateProviderSchema>
export type AdminCreatePetInput = z.infer<typeof adminCreatePetSchema>
export type AdminUpdatePetInput = z.infer<typeof adminUpdatePetSchema>
export type RequestInfoInput = z.infer<typeof requestInfoSchema>
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>
export type AdminCreateDisputeInput = z.infer<typeof adminCreateDisputeSchema>
export type SuspendUserInput = z.infer<typeof suspendUserSchema>
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>

export const updateConfigSchema = z.object({
  commission_rate: z.number().min(0).max(1).optional(),
  auto_confirm_hours: z.number().int().positive().optional(),
  payment_timeout_hours: z.number().int().positive().optional(),
})

export const adminMessageSchema = z.object({
  message: z.string().min(1).max(2000),
})

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>
export type AdminMessageInput = z.infer<typeof adminMessageSchema>
