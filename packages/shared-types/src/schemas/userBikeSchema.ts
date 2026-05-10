import { z } from 'zod'

/**
 * ユーザーバイク登録リクエストのバリデーションスキーマ
 */
export const UserBikeRegisterRequestSchema = z
  .object({
    bikeId: z
      .string({
        invalid_type_error: 'bikeIdは文字列で指定してください',
      })
      .min(1, 'bikeIdは1文字以上で指定してください')
      .nullish(),
    displacement: z
      .number({
        invalid_type_error: '排気量は数値で指定してください',
      })
      .positive('排気量は0より大きい値で指定してください')
      .optional(),
    serialNumber: z
      .string({ invalid_type_error: '車台番号は文字列で指定してください' })
      .trim()
      .min(1, '車台番号は1文字以上で指定してください')
      .max(100, '車台番号は100文字以内で指定してください')
      .nullish(),
    nickname: z
      .string({
        invalid_type_error: 'ニックネームは文字列で指定してください',
      })
      .trim()
      .min(1, 'ニックネームは1文字以上で指定してください')
      .max(50, 'ニックネームは50文字以内で指定してください')
      .optional(),
    purchaseDate: z.coerce
      .date({
        invalid_type_error: '購入日は日付形式で指定してください',
      })
      .optional(),
    purchasePrice: z
      .number({ invalid_type_error: '購入価格は数値で指定してください' })
      .int('購入価格は整数で指定してください')
      .nonnegative('購入価格は0以上で指定してください')
      .optional(),
    purchaseMileage: z
      .number({ invalid_type_error: '購入時走行距離は数値で指定してください' })
      .int('購入時走行距離は整数で指定してください')
      .nonnegative('購入時走行距離は0以上で指定してください')
      .optional(),
    totalMileage: z
      .number({ invalid_type_error: '総走行距離は数値で指定してください' })
      .int('総走行距離は整数で指定してください')
      .nonnegative('総走行距離は0以上で指定してください')
      .optional(),
  })
  .refine(
    (data) => data.bikeId !== undefined || data.displacement !== undefined,
    {
      message: 'bikeIdまたは排気量を指定してください',
      path: ['bikeId'],
    }
  )

export type UserBikeRegisterRequest = z.infer<
  typeof UserBikeRegisterRequestSchema
>

/**
 * ユーザーバイク更新リクエストのバリデーションスキーマ
 */
export const UserBikeUpdateRequestSchema = z
  .object({
    nickname: z
      .string({ invalid_type_error: 'ニックネームは文字列で指定してください' })
      .trim()
      .min(1, 'ニックネームは1文字以上で指定してください')
      .max(50, 'ニックネームは50文字以内で指定してください')
      .nullable()
      .optional(),
    purchaseDate: z.coerce
      .date({
        invalid_type_error: '購入日は日付形式で指定してください',
      })
      .nullable()
      .optional(),
    purchasePrice: z
      .number({ invalid_type_error: '購入価格は数値で指定してください' })
      .int('購入価格は整数で指定してください')
      .nonnegative('購入価格は0以上で指定してください')
      .nullable()
      .optional(),
    purchaseMileage: z
      .number({ invalid_type_error: '購入時走行距離は数値で指定してください' })
      .int('購入時走行距離は整数で指定してください')
      .nonnegative('購入時走行距離は0以上で指定してください')
      .nullable()
      .optional(),
    displacement: z
      .number({ invalid_type_error: '排気量は数値で指定してください' })
      .positive('排気量は0より大きい値で指定してください')
      .optional(),
    totalMileage: z
      .number({ invalid_type_error: '総走行距離は数値で指定してください' })
      .int('総走行距離は整数で指定してください')
      .nonnegative('総走行距離は0以上で指定してください')
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.nickname !== undefined ||
      data.purchaseDate !== undefined ||
      data.purchasePrice !== undefined ||
      data.purchaseMileage !== undefined ||
      data.totalMileage !== undefined ||
      data.displacement !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )

export type UserBikeUpdateRequest = z.infer<typeof UserBikeUpdateRequestSchema>

/**
 * ユーザーバイク一覧取得クエリパラメータのバリデーションスキーマ
 */
export const UserBikeListQuerySchema = z.object({
  'sort-by': z
    .enum(['created-at', 'updated-at'])
    .default('updated-at')
    .optional(),
  'sort-order': z.enum(['asc', 'desc']).default('desc').optional(),
})

export type UserBikeListQuery = z.infer<typeof UserBikeListQuerySchema>
