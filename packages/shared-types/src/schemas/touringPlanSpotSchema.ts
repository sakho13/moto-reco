import { z } from 'zod'

/**
 * ツーリングプランスポット（経由地・休憩）登録リクエストのバリデーションスキーマ
 *
 * @remarks
 * START/DESTINATION は専用エンドポイント（出発地・目的地設定）で扱うため、
 * ここでは SPOT/BREAK のみを許可する。
 */
export const TouringPlanSpotRegisterRequestSchema = z
  .object({
    type: z.enum(['SPOT', 'BREAK'], {
      required_error: 'タイプは必須です',
      invalid_type_error: 'タイプはSPOTまたはBREAKで指定してください',
    }),
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
    plannedArrivalAt: z.coerce
      .date({
        invalid_type_error: '到着予定日時は日付形式で指定してください',
      })
      .optional(),
    plannedDepartureAt: z.coerce
      .date({
        invalid_type_error: '出発予定日時は日付形式で指定してください',
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.plannedArrivalAt === undefined ||
      data.plannedDepartureAt === undefined ||
      data.plannedArrivalAt <= data.plannedDepartureAt,
    {
      message: '到着予定日時は出発予定日時以前で指定してください',
      path: ['plannedArrivalAt'],
    }
  )

export type TouringPlanSpotRegisterRequest = z.infer<
  typeof TouringPlanSpotRegisterRequestSchema
>

/**
 * ツーリングプランスポット（経由地・休憩）更新リクエストのバリデーションスキーマ
 */
export const TouringPlanSpotUpdateRequestSchema = z
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
    plannedArrivalAt: z.coerce
      .date({
        invalid_type_error: '到着予定日時は日付形式で指定してください',
      })
      .nullable()
      .optional(),
    plannedDepartureAt: z.coerce
      .date({
        invalid_type_error: '出発予定日時は日付形式で指定してください',
      })
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.memo !== undefined ||
      data.latitude !== undefined ||
      data.longitude !== undefined ||
      data.plannedArrivalAt !== undefined ||
      data.plannedDepartureAt !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )
  .refine(
    (data) =>
      data.plannedArrivalAt === undefined ||
      data.plannedArrivalAt === null ||
      data.plannedDepartureAt === undefined ||
      data.plannedDepartureAt === null ||
      data.plannedArrivalAt <= data.plannedDepartureAt,
    {
      message: '到着予定日時は出発予定日時以前で指定してください',
      path: ['plannedArrivalAt'],
    }
  )

export type TouringPlanSpotUpdateRequest = z.infer<
  typeof TouringPlanSpotUpdateRequestSchema
>

/**
 * ツーリングプランスポット並び替えリクエストのバリデーションスキーマ
 *
 * @remarks
 * 並び替え対象は経由地・休憩（SPOT/BREAK）のIDのみ。
 */
export const TouringPlanSpotReorderRequestSchema = z.object({
  spotIds: z.array(z.string()).min(1, 'スポットIDを1件以上指定してください'),
})

export type TouringPlanSpotReorderRequest = z.infer<
  typeof TouringPlanSpotReorderRequestSchema
>
