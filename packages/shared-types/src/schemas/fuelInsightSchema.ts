import { z } from 'zod'

/**
 * 燃費インサイト取得クエリパラメータのバリデーションスキーマ
 */
export const FuelInsightQuerySchema = z.object({
  period: z
    .enum(['last-5', 'past-month', 'past-half-year', 'past-year', 'all'])
    .default('all'),
})

export type FuelInsightQuery = z.infer<typeof FuelInsightQuerySchema>
