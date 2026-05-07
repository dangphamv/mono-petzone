import { z } from 'zod'

const messageRefine = (data: { type?: string; content?: string; image_url?: string }) =>
  data.type === 'image' ? !!data.image_url : !!data.content

const messageRefineMsg = 'Text messages require content, image messages require image_url'

const sendMessageBase = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().max(2000).optional(),
  type: z.enum(['text', 'image']).default('text'),
  image_url: z.string().url().optional(),
})

export const sendMessageSchema = sendMessageBase.refine(messageRefine, { message: messageRefineMsg })

export const sendMessageBodySchema = sendMessageBase.omit({ conversation_id: true }).refine(messageRefine, { message: messageRefineMsg })

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type SendMessageBodyInput = z.infer<typeof sendMessageBodySchema>

export const createConversationSchema = z
  .object({
    provider_id: z.string().uuid().optional(),
    owner_id: z.string().uuid().optional(),
    order_id: z.string().uuid().optional(),
  })
  .refine((d) => !!d.provider_id || !!d.owner_id || !!d.order_id, {
    message: 'order_id, provider_id, or owner_id is required',
  })

export type CreateConversationInput = z.infer<typeof createConversationSchema>
