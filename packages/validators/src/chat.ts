import { z } from 'zod'

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().max(2000).optional(),
  type: z.enum(['text', 'image']).default('text'),
  image_url: z.string().url().optional(),
}).refine(
  (data) => data.type === 'image' ? !!data.image_url : !!data.content,
  { message: 'Text messages require content, image messages require image_url' }
)

export type SendMessageInput = z.infer<typeof sendMessageSchema>
