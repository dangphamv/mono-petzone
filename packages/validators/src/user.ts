import { z } from 'zod'

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  avatar_url: z.string().url().optional(),
  email: z.string().email().optional(),
})

export const notificationPreferencesSchema = z.object({
  order_status: z.boolean().optional(),
  new_message: z.boolean().optional(),
  status_report: z.boolean().optional(),
  review: z.boolean().optional(),
  promotion: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>
