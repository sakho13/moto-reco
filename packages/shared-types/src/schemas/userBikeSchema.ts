import { z } from 'zod'

/**
 * ユーザーバイク登録リクエストのバリデーションスキーマ
 *
 * @remarks
 * - bikeId: バイク車種ID（必須）
 * - serialNumber: 車台番号（必須、1〜50文字）
 * - nickname: ニックネーム（任意、50文字以下）
 * - purchaseDate: 購入日（任意、ISO8601形式）
 * - purchasePrice: 購入価格（任意、0以上の整数）
 * - purchaseMileage: 購入時走行距離（任意、0以上の整数）
 */
export const UserBikeRegisterRequestSchema = z.object({
  bikeId: z.string({
    required_error: 'バイクIDは必須です',
    invalid_type_error: 'バイクIDは文字列である必要があります',
  }),
  serialNumber: z
    .string({
      required_error: '車台番号は必須です',
      invalid_type_error: '車台番号は文字列である必要があります',
    })
    .min(1, '車台番号は1文字以上である必要があります')
    .max(50, '車台番号は50文字以内である必要があります')
    .trim(),
  nickname: z
    .string({
      invalid_type_error: 'ニックネームは文字列である必要があります',
    })
    .max(50, 'ニックネームは50文字以内である必要があります')
    .trim()
    .nullable()
    .optional(),
  purchaseDate: z.coerce
    .date({
      invalid_type_error: '購入日は有効な日付である必要があります',
    })
    .nullable()
    .optional(),
  purchasePrice: z
    .number({
      invalid_type_error: '購入価格は数値である必要があります',
    })
    .int('購入価格は整数である必要があります')
    .nonnegative('購入価格は0以上である必要があります')
    .nullable()
    .optional(),
  purchaseMileage: z
    .number({
      invalid_type_error: '購入時走行距離は数値である必要があります',
    })
    .int('購入時走行距離は整数である必要があります')
    .nonnegative('購入時走行距離は0以上である必要があります')
    .nullable()
    .optional(),
})

/**
 * ユーザーバイク登録リクエストの型
 */
export type UserBikeRegisterRequest = z.infer<
  typeof UserBikeRegisterRequestSchema
>
