import { z } from 'zod'

export const createStatusReportSchema = z.object({
  photos: z.array(z.string().url()).max(10).default([]),
  feeding_status: z.enum(['normal', 'eating_less', 'not_eating']).optional(),
  activity_summary: z.string().max(2000).optional(),
  note: z.string().max(2000).optional(),
})

export const reactStatusReportSchema = z.object({
  reaction: z.enum(['heart', 'thumbs_up']),
})

export const replyStatusReportSchema = z.object({
  text: z.string().min(1).max(500),
})

export type CreateStatusReportInput = z.infer<typeof createStatusReportSchema>
export type ReactStatusReportInput = z.infer<typeof reactStatusReportSchema>
export type ReplyStatusReportInput = z.infer<typeof replyStatusReportSchema>
