import { z } from 'zod'

const BUCKET_ENUM = z.enum(['avatars', 'pet-photos', 'provider-photos', 'check-in-photos', 'chat-media', 'review-photos'])

export const presignedUrlSchema = z.object({
  bucket: BUCKET_ENUM,
  filename: z.string().min(1),
  content_type: z.string().min(1),
})

export const uploadImageSchema = z.object({
  bucket: BUCKET_ENUM,
  base64: z.string().min(1),
  filename: z.string().min(1),
})

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>
export type UploadImageInput = z.infer<typeof uploadImageSchema>
