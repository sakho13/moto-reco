import { z } from 'zod'

/**
 * ユーザーバイク登録リクエストのバリデーションスキーマ
 *
 * @remarks
 * - userBikeId: バイク車種ID（必須）
 * - nickname: ニックネーム（任意、50文字以下）
 * - purchaseDate: 購入日（任意、ISO8601形式）
 * - mileage: 購入時走行距離（任意、0以上の整数）
 */
export const UserBikeRegisterRequestSchema = z.object({
  userBikeId: z.string({
    required_error: 'バイクIDは必須です',
    invalid_type_error: 'バイクIDは文字列である必要があります',
  }),
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
  mileage: z
    .number({
      invalid_type_error: '走行距離は数値である必要があります',
    })
    .int('走行距離は整数である必要があります')
    .nonnegative('走行距離は0以上である必要があります')
    .nullable()
    .optional(),
})

/**
 * ユーザーバイク登録リクエストの型
 */
export type UserBikeRegisterRequest = z.infer<
  typeof UserBikeRegisterRequestSchema
>
