import { z } from 'zod'

export const searchProvidersSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius_km: z.number().positive().max(50).default(10),
  check_in_date: z.string().optional(),
  check_out_date: z.string().optional(),
  species: z.enum(['dog', 'cat', 'other']).optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  min_rating: z.number().min(1).max(5).optional(),
  sort_by: z.enum(['distance', 'price_asc', 'price_desc', 'rating']).default('distance'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export type SearchProvidersInput = z.infer<typeof searchProvidersSchema>
