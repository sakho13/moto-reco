import { z } from 'zod'

/**
 * 燃料ログ登録リクエストのバリデーションスキーマ
 */
export const FuelLogRegisterRequestSchema = z
  .object({
    refueledAt: z.coerce.date({
      required_error: '給油日時は必須です',
      invalid_type_error: '給油日時は日付形式で指定してください',
    }),
    mileage: z
      .number({
        required_error: '走行距離は必須です',
        invalid_type_error: '走行距離は数値で指定してください',
      })
      .int('走行距離は整数で指定してください')
      .nonnegative('走行距離は0以上で指定してください'),
    previousMileage: z
      .number({
        required_error: '前回走行距離は必須です',
        invalid_type_error: '前回走行距離は数値で指定してください',
      })
      .int('前回走行距離は整数で指定してください')
      .nonnegative('前回走行距離は0以上で指定してください'),
    amount: z
      .number({
        required_error: '給油量は必須です',
        invalid_type_error: '給油量は数値で指定してください',
      })
      .positive('給油量は0より大きい値で指定してください'),
    totalPrice: z
      .number({
        required_error: '合計価格は必須です',
        invalid_type_error: '合計価格は数値で指定してください',
      })
      .int('合計価格は整数で指定してください')
      .nonnegative('合計価格は0以上で指定してください'),
    memo: z
      .string({
        invalid_type_error: 'メモは文字列で指定してください',
      })
      .max(500, 'メモは500文字以内で指定してください')
      .nullable()
      .optional(),
    updateTotalMileage: z.boolean().default(false),
  })
  .refine((data) => data.previousMileage <= data.mileage, {
    message: '前回走行距離は給油時走行距離以下で指定してください',
    path: ['previousMileage'],
  })

export type FuelLogRegisterRequest = z.infer<
  typeof FuelLogRegisterRequestSchema
>

/**
 * 燃料ログ一覧取得クエリパラメータのバリデーションスキーマ
 */
export const FuelLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  'per-size': z.coerce.number().int().min(1).max(100).default(20).optional(),
  'sort-by': z.enum(['refueled-at', 'mileage']).optional(),
  'sort-order': z.enum(['asc', 'desc']).default('desc').optional(),
})

export type FuelLogListQuery = z.infer<typeof FuelLogListQuerySchema>

/**
 * 燃料ログ更新リクエストのバリデーションスキーマ
 */
export const FuelLogUpdateRequestSchema = z
  .object({
    fuelLogId: z
      .string({
        required_error: '燃料ログIDは必須です',
        invalid_type_error: '燃料ログIDは文字列で指定してください',
      })
      .min(1, '燃料ログIDは1文字以上で指定してください'),
    refueledAt: z.coerce
      .date({
        invalid_type_error: '給油日時は日付形式で指定してください',
      })
      .optional(),
    mileage: z
      .number({
        invalid_type_error: '走行距離は数値で指定してください',
      })
      .int('走行距離は整数で指定してください')
      .nonnegative('走行距離は0以上で指定してください')
      .optional(),
    previousMileage: z
      .number({
        invalid_type_error: '前回走行距離は数値で指定してください',
      })
      .int('前回走行距離は整数で指定してください')
      .nonnegative('前回走行距離は0以上で指定してください')
      .optional(),
    amount: z
      .number({
        invalid_type_error: '給油量は数値で指定してください',
      })
      .positive('給油量は0より大きい値で指定してください')
      .optional(),
    totalPrice: z
      .number({
        invalid_type_error: '合計価格は数値で指定してください',
      })
      .int('合計価格は整数で指定してください')
      .nonnegative('合計価格は0以上で指定してください')
      .optional(),
    memo: z
      .string({
        invalid_type_error: 'メモは文字列で指定してください',
      })
      .max(500, 'メモは500文字以内で指定してください')
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.refueledAt !== undefined ||
      data.mileage !== undefined ||
      data.previousMileage !== undefined ||
      data.amount !== undefined ||
      data.totalPrice !== undefined ||
      data.memo !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )
  .refine(
    (data) =>
      data.previousMileage === undefined ||
      data.mileage === undefined ||
      data.previousMileage <= data.mileage,
    {
      message: '前回走行距離は給油時走行距離以下で指定してください',
      path: ['previousMileage'],
    }
  )

export type FuelLogUpdateRequest = z.infer<typeof FuelLogUpdateRequestSchema>

/**
 * 燃料ログ削除リクエストのバリデーションスキーマ
 */
export const FuelLogDeleteRequestSchema = z.object({
  fuelLogId: z
    .string({
      required_error: '燃料ログIDは必須です',
      invalid_type_error: '燃料ログIDは文字列で指定してください',
    })
    .min(1, '燃料ログIDは1文字以上で指定してください'),
})

export type FuelLogDeleteRequest = z.infer<typeof FuelLogDeleteRequestSchema>
