import { z } from 'zod'

export const registerProviderSchema = z.object({
  business_name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  license_number: z.string().max(100).optional(),
  license_photos: z.array(z.string().url()).min(1).max(3),
  address: z.string().min(5).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  facility_photos: z.array(z.string().url()).min(5).max(30),
  certification_photos: z.array(z.string().url()).max(10).default([]),
  accepted_species: z.array(z.enum(['dog', 'cat', 'other'])).min(1),
  weight_limit_min_kg: z.number().positive().optional(),
  weight_limit_max_kg: z.number().positive().optional(),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict']).default('flexible'),
})

export const updateListingSchema = registerProviderSchema.partial()

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  capacity: z.number().int().positive().default(1),
  price_per_night: z.number().int().min(50000).max(10000000),
  photos: z.array(z.string().url()).max(5).default([]),
})

export const updateRoomSchema = createRoomSchema.partial()

export const createAddOnSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().int().positive(),
  price_type: z.enum(['per_night', 'per_booking', 'per_pet']),
})

export const updateAddOnSchema = createAddOnSchema.partial()

export const updateAvailabilitySchema = z.object({
  room_type_id: z.string().uuid(),
  dates: z.array(z.object({
    date: z.string(),
    available_slots: z.number().int().min(0),
    is_blocked: z.boolean().default(false),
  })),
})

export type RegisterProviderInput = z.infer<typeof registerProviderSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>
export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
export type CreateAddOnInput = z.infer<typeof createAddOnSchema>
export type UpdateAddOnInput = z.infer<typeof updateAddOnSchema>
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>
