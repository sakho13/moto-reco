import { z } from 'zod'

/**
 * 燃料ログ登録リクエストのバリデーションスキーマ
 */
export const FuelLogRegisterRequestSchema = z.object({
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
  updateTotalMileage: z.boolean().default(false),
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
