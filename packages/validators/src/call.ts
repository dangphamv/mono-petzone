import { z } from 'zod'

export const initiateCallSchema = z.object({
  type: z.enum(['voice', 'video']),
})

export type InitiateCallInput = z.infer<typeof initiateCallSchema>
