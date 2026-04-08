import { z } from 'zod'

export const uploadCheckInPhotosSchema = z.object({
  photos: z.array(z.string().url()).min(1).max(10),
  handoff_point: z.enum(['owner_to_store', 'store_to_owner']),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(1000).optional(),
})

export type UploadCheckInPhotosInput = z.infer<typeof uploadCheckInPhotosSchema>
