import { z } from 'zod'

export const initiateCallSchema = z.object({
  type: z.enum(['voice', 'video']),
})

export const endCallSchema = z.object({
  duration_seconds: z.number().int().min(0),
})

export type InitiateCallInput = z.infer<typeof initiateCallSchema>
export type EndCallInput = z.infer<typeof endCallSchema>
