import { z } from 'zod'

/**
 * バイク検索APIのクエリパラメータスキーマ
 *
 * @remarks
 * 数値は整数・有限値に限定し、Prisma に不正な skip / take / 範囲値が渡って
 * 500 になることを防ぐ（不正値は 400 VALIDATION_ERROR とする）。
 */
export const BikeSearchQuerySchema = z.object({
  'mf-op': z.enum(['eq', 'ne', 'in']).optional(),
  mf: z.string().trim().min(1).optional(),
  'model-name': z.string().optional(),
  'displacement-min': z.coerce.number().finite().min(0).optional(),
  'displacement-max': z.coerce.number().finite().min(0).optional(),
  'model-year-min': z.coerce.number().int().min(0).optional(),
  'model-year-max': z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).optional(),
  'page-size': z.coerce.number().int().min(1).max(100).optional(),
  'sort-by': z.enum(['modelName', 'displacement', 'modelYear']).optional(),
  'sort-order': z.enum(['asc', 'desc']).optional(),
})

export type BikeSearchQuery = z.infer<typeof BikeSearchQuerySchema>
