import { z } from 'zod'

/**
 * ユーザー所有バイクの燃料ログ登録リクエストのバリデーションスキーマ
 */
export const MyUserBikeFuelLogRegisterRequestSchema = z.object({
  refueledAt: z.coerce.date({
    required_error: '給油日時は必須です',
    invalid_type_error: '給油日時は日付形式で指定してください',
  }),
  mileage: z
    .number({ invalid_type_error: '給油時走行距離は数値で指定してください' })
    .int('給油時走行距離は整数で指定してください')
    .nonnegative('給油時走行距離は0以上で指定してください'),
  amount: z
    .number({ invalid_type_error: '給油量は数値で指定してください' })
    .positive('給油量は0より大きい数値で指定してください'),
  totalPrice: z
    .number({ invalid_type_error: '合計価格は数値で指定してください' })
    .int('合計価格は整数で指定してください')
    .nonnegative('合計価格は0以上で指定してください'),
  updateTotalMileage: z
    .boolean({
      invalid_type_error: '総走行距離の更新有無は真偽値で指定してください',
    })
    .optional()
    .default(false),
})

export type MyUserBikeFuelLogRegisterRequest = z.infer<
  typeof MyUserBikeFuelLogRegisterRequestSchema
>
