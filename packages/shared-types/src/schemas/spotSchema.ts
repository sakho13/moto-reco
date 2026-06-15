import { z } from 'zod'

/**
 * スポット登録リクエストのバリデーションスキーマ
 *
 * @remarks
 * `plannedArrivalAt`/`plannedDepartureAt`（プラン由来の参考予定値）はサーバ側の
 * コピー処理でのみ設定され、APIからは設定不可。
 */
export const SpotRegisterRequestSchema = z
  .object({
    type: z
      .enum(['SPOT', 'BREAK'], {
        invalid_type_error: 'タイプはSPOTまたはBREAKで指定してください',
      })
      .default('SPOT')
      .optional(),
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
    arrivedAt: z.coerce
      .date({
        invalid_type_error: '到着日時は日付形式で指定してください',
      })
      .optional(),
    departedAt: z.coerce
      .date({
        invalid_type_error: '出発日時は日付形式で指定してください',
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.arrivedAt === undefined ||
      data.departedAt === undefined ||
      data.arrivedAt <= data.departedAt,
    {
      message: '到着日時は出発日時以前で指定してください',
      path: ['arrivedAt'],
    }
  )

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
    arrivedAt: z.coerce
      .date({
        invalid_type_error: '到着日時は日付形式で指定してください',
      })
      .nullable()
      .optional(),
    departedAt: z.coerce
      .date({
        invalid_type_error: '出発日時は日付形式で指定してください',
      })
      .nullable()
      .optional(),
    isSkipped: z
      .boolean({
        invalid_type_error: 'スキップフラグは真偽値で指定してください',
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.memo !== undefined ||
      data.latitude !== undefined ||
      data.longitude !== undefined ||
      data.arrivedAt !== undefined ||
      data.departedAt !== undefined ||
      data.isSkipped !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )
  .refine(
    (data) =>
      data.arrivedAt === undefined ||
      data.arrivedAt === null ||
      data.departedAt === undefined ||
      data.departedAt === null ||
      data.arrivedAt <= data.departedAt,
    {
      message: '到着日時は出発日時以前で指定してください',
      path: ['arrivedAt'],
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
