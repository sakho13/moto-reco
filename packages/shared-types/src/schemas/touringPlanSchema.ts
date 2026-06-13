import { z } from 'zod'

/**
 * ツーリングプランのロケーション（出発地・目的地）共通スキーマ
 */
export const TouringPlanLocationSchema = z.object({
  latitude: z
    .number({
      required_error: '緯度は必須です',
      invalid_type_error: '緯度は数値で指定してください',
    })
    .min(-90, '緯度は-90以上で指定してください')
    .max(90, '緯度は90以下で指定してください'),
  longitude: z
    .number({
      required_error: '経度は必須です',
      invalid_type_error: '経度は数値で指定してください',
    })
    .min(-180, '経度は-180以上で指定してください')
    .max(180, '経度は180以下で指定してください'),
  name: z
    .string({
      invalid_type_error: '名称は文字列で指定してください',
    })
    .max(100, '名称は100文字以内で指定してください')
    .optional(),
  memo: z
    .string({
      invalid_type_error: 'メモは文字列で指定してください',
    })
    .max(500, 'メモは500文字以内で指定してください')
    .optional(),
})

export type TouringPlanLocation = z.infer<typeof TouringPlanLocationSchema>

/**
 * ツーリングプラン登録リクエストのバリデーションスキーマ
 */
export const TouringPlanRegisterRequestSchema = z.object({
  title: z
    .string({
      required_error: 'タイトルは必須です',
      invalid_type_error: 'タイトルは文字列で指定してください',
    })
    .min(1, 'タイトルは1文字以上で指定してください')
    .max(100, 'タイトルは100文字以内で指定してください')
    .trim(),
  departAt: z.coerce.date({
    required_error: '出発予定日時は必須です',
    invalid_type_error: '出発予定日時は日付形式で指定してください',
  }),
  startLocation: TouringPlanLocationSchema.extend({
    plannedDepartureAt: z.coerce
      .date({
        invalid_type_error: '出発予定時刻は日付形式で指定してください',
      })
      .optional(),
  })
    .nullable()
    .optional(),
  destinationLocation: TouringPlanLocationSchema.extend({
    plannedArrivalAt: z.coerce
      .date({
        invalid_type_error: '到着予定時刻は日付形式で指定してください',
      })
      .optional(),
  })
    .nullable()
    .optional(),
})

export type TouringPlanRegisterRequest = z.infer<
  typeof TouringPlanRegisterRequestSchema
>

/**
 * ツーリングプラン更新リクエストのバリデーションスキーマ
 */
export const TouringPlanUpdateRequestSchema = z
  .object({
    title: z
      .string({
        invalid_type_error: 'タイトルは文字列で指定してください',
      })
      .min(1, 'タイトルは1文字以上で指定してください')
      .max(100, 'タイトルは100文字以内で指定してください')
      .trim()
      .optional(),
    departAt: z.coerce
      .date({
        invalid_type_error: '出発予定日時は日付形式で指定してください',
      })
      .optional(),
  })
  .refine((data) => data.title !== undefined || data.departAt !== undefined, {
    message: 'いずれかの更新項目を指定してください',
  })

export type TouringPlanUpdateRequest = z.infer<
  typeof TouringPlanUpdateRequestSchema
>

/**
 * ツーリングプラン出発地設定リクエストのバリデーションスキーマ
 *
 * @remarks
 * `null` を指定した場合は出発地を未設定に戻す（解除）。
 */
export const TouringPlanStartLocationUpdateRequestSchema =
  TouringPlanLocationSchema.nullable()

export type TouringPlanStartLocationUpdateRequest = z.infer<
  typeof TouringPlanStartLocationUpdateRequestSchema
>

/**
 * ツーリングプラン目的地設定リクエストのバリデーションスキーマ
 *
 * @remarks
 * `null` を指定した場合は目的地を未設定に戻す（解除）。
 */
export const TouringPlanDestinationLocationUpdateRequestSchema =
  TouringPlanLocationSchema.extend({
    travelMinutesFromPrev: z
      .number({
        invalid_type_error: '前の地点からの移動時間は数値で指定してください',
      })
      .int('前の地点からの移動時間は整数で指定してください')
      .min(0, '前の地点からの移動時間は0以上で指定してください')
      .max(1440, '前の地点からの移動時間は1440以下で指定してください')
      .nullable()
      .optional(),
    routeTypeFromPrev: z
      .enum(['GENERAL', 'HIGHWAY', 'MIXED'], {
        invalid_type_error:
          '前の地点からの移動経路はGENERAL・HIGHWAY・MIXEDのいずれかで指定してください',
      })
      .nullable()
      .optional(),
  }).nullable()

export type TouringPlanDestinationLocationUpdateRequest = z.infer<
  typeof TouringPlanDestinationLocationUpdateRequestSchema
>

/**
 * ツーリングプラン一覧取得クエリパラメータのバリデーションスキーマ
 */
export const TouringPlanListQuerySchema = z.object({
  'sort-by': z.enum(['depart-date', 'return-date']).optional(),
  'sort-order': z.enum(['asc', 'desc']).default('desc').optional(),
})

export type TouringPlanListQuery = z.infer<typeof TouringPlanListQuerySchema>
