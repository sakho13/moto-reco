import { z } from 'zod'

/**
 * グッズ型番検索クエリパラメータのバリデーションスキーマ
 */
export const GoodsModelSearchQuerySchema = z.object({
  manufacturerId: z
    .string({
      invalid_type_error: 'メーカーIDは文字列で指定してください',
    })
    .min(1, 'メーカーIDは1文字以上で指定してください')
    .optional(),
  category: z
    .enum([
      'HELMET',
      'GLOVE',
      'JACKET',
      'PANTS',
      'BOOTS',
      'RAINWEAR',
      'INTERCOM',
      'DRIVE_RECORDER',
      'NAVIGATION',
      'BOX_CASE',
      'BAG',
      'CHAIN_LOCK',
      'COVER',
      'TOOL',
      'OTHER',
    ])
    .optional(),
  keyword: z
    .string({
      invalid_type_error: 'キーワードは文字列で指定してください',
    })
    .trim()
    .min(1, 'キーワードは1文字以上で指定してください')
    .optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  'per-size': z.coerce.number().int().min(1).max(100).default(20).optional(),
})

export type GoodsModelSearchQuery = z.infer<typeof GoodsModelSearchQuerySchema>
