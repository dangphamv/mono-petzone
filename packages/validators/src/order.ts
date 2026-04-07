import { z } from 'zod'

export const createOrderSchema = z.object({
  provider_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  pet_ids: z.array(z.string().uuid()).min(1),
  check_in_date: z.string(),
  check_out_date: z.string(),
  add_on_ids: z.array(z.string().uuid()).default([]),
  special_notes: z.string().max(1000).optional(),
  daily_status_report: z.boolean().default(true),
})

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'checked_in', 'in_progress', 'check_out', 'completed']),
  note: z.string().max(500).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
