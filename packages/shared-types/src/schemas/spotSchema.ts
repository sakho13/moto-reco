import { z } from 'zod'

/**
 * スポット登録リクエストのバリデーションスキーマ
 */
export const SpotRegisterRequestSchema = z.object({
  name: z
    .string({
      invalid_type_error: 'スポット名は文字列で指定してください',
    })
    .max(100, 'スポット名は100文字以内で指定してください')
    .optional(),
  memo: z
    .string({
      invalid_type_error: 'メモは文字列で指定してください',
    })
    .max(500, 'メモは500文字以内で指定してください')
    .optional(),
  latitude: z
    .number({
      invalid_type_error: '緯度は数値で指定してください',
    })
    .min(-90, '緯度は-90以上で指定してください')
    .max(90, '緯度は90以下で指定してください')
    .optional(),
  longitude: z
    .number({
      invalid_type_error: '経度は数値で指定してください',
    })
    .min(-180, '経度は-180以上で指定してください')
    .max(180, '経度は180以下で指定してください')
    .optional(),
  visitedAt: z.coerce
    .date({
      invalid_type_error: '訪問日時は日付形式で指定してください',
    })
    .optional(),
})

export type SpotRegisterRequest = z.infer<typeof SpotRegisterRequestSchema>

/**
 * スポット更新リクエストのバリデーションスキーマ
 */
export const SpotUpdateRequestSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: 'スポット名は文字列で指定してください',
      })
      .max(100, 'スポット名は100文字以内で指定してください')
      .nullable()
      .optional(),
    memo: z
      .string({
        invalid_type_error: 'メモは文字列で指定してください',
      })
      .max(500, 'メモは500文字以内で指定してください')
      .nullable()
      .optional(),
    latitude: z
      .number({
        invalid_type_error: '緯度は数値で指定してください',
      })
      .min(-90, '緯度は-90以上で指定してください')
      .max(90, '緯度は90以下で指定してください')
      .nullable()
      .optional(),
    longitude: z
      .number({
        invalid_type_error: '経度は数値で指定してください',
      })
      .min(-180, '経度は-180以上で指定してください')
      .max(180, '経度は180以下で指定してください')
      .nullable()
      .optional(),
    visitedAt: z.coerce
      .date({
        invalid_type_error: '訪問日時は日付形式で指定してください',
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.memo !== undefined ||
      data.latitude !== undefined ||
      data.longitude !== undefined ||
      data.visitedAt !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )

export type SpotUpdateRequest = z.infer<typeof SpotUpdateRequestSchema>

/**
 * スポット並び替えリクエストのバリデーションスキーマ
 */
export const SpotReorderRequestSchema = z.object({
  spotIds: z.array(z.string()).min(1, 'スポットIDを1件以上指定してください'),
})

export type SpotReorderRequest = z.infer<typeof SpotReorderRequestSchema>
