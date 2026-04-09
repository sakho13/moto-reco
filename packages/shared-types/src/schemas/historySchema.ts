import { z } from 'zod'

export const HistoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  'per-size': z.coerce.number().int().min(1).max(100).default(20).optional(),
})

export type HistoryListQuery = z.infer<typeof HistoryListQuerySchema>
