import { z } from 'zod'

export const createReviewSchema = z.object({
  order_id: z.string().uuid(),
  rating_overall: z.number().int().min(1).max(5),
  rating_cleanliness: z.number().int().min(1).max(5).optional(),
  rating_care_quality: z.number().int().min(1).max(5).optional(),
  rating_communication: z.number().int().min(1).max(5).optional(),
  rating_value: z.number().int().min(1).max(5).optional(),
  text: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(5).default([]),
})

export const respondReviewSchema = z.object({
  response: z.string().min(1).max(500),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type RespondReviewInput = z.infer<typeof respondReviewSchema>
