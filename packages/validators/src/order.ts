import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').refine(
  (s) => !isNaN(Date.parse(s)),
  'Invalid date',
)

export const createOrderSchema = z.object({
  provider_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  pet_ids: z.array(z.string().uuid()).min(1).max(10),
  check_in_date: dateString,
  check_out_date: dateString,
  add_on_ids: z.array(z.string().uuid()).max(20).default([]),
  special_notes: z.string().max(1000).optional(),
  daily_status_report: z.boolean().default(true),
}).refine(
  (d) => new Date(d.check_out_date) > new Date(d.check_in_date),
  { message: 'Check-out date must be after check-in date', path: ['check_out_date'] },
)

export const adminCreateOrderSchema = z.object({
  owner_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  pet_ids: z.array(z.string().uuid()).min(1).max(10),
  check_in_date: dateString,
  check_out_date: dateString,
  add_on_ids: z.array(z.string().uuid()).max(20).default([]),
  special_notes: z.string().max(1000).optional(),
  daily_status_report: z.boolean().default(true),
}).refine(
  (d) => new Date(d.check_out_date) > new Date(d.check_in_date),
  { message: 'Check-out date must be after check-in date', path: ['check_out_date'] },
)

export const calculatePriceSchema = z.object({
  provider_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  pet_ids: z.array(z.string().uuid()).min(1).max(10),
  check_in_date: dateString,
  check_out_date: dateString,
  add_on_ids: z.array(z.string().uuid()).max(20).default([]),
}).refine(
  (d) => new Date(d.check_out_date) > new Date(d.check_in_date),
  { message: 'Check-out date must be after check-in date', path: ['check_out_date'] },
)

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
})

export const declineOrderSchema = z.object({
  reason: z.string().min(1).max(500),
})

export const checkOutOrderSchema = z.object({
  photos: z.array(z.string().url({ message: 'Each photo must be a valid URL' })).min(1).max(5),
  note: z.string().max(500).optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'checked_in', 'in_progress', 'check_out', 'completed']),
  note: z.string().max(500).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type AdminCreateOrderInput = z.infer<typeof adminCreateOrderSchema>
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type DeclineOrderInput = z.infer<typeof declineOrderSchema>
export type CheckOutOrderInput = z.infer<typeof checkOutOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
