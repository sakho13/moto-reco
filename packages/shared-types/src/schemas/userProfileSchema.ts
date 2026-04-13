import { z } from 'zod'

/**
 * ユーザープロフィール更新リクエストのバリデーションスキーマ
 *
 * @remarks
 * - name: 1文字以上50文字以下の文字列
 */
export const UserProfileUpdateRequestSchema = z.object({
  name: z
    .string({
      required_error: '名前は必須です',
      invalid_type_error: '名前は文字列である必要があります',
    })
    .min(1, '名前は1文字以上である必要があります')
    .max(50, '名前は50文字以内である必要があります')
    .trim(),
})

/**
 * ユーザー認証登録リクエストのバリデーションスキーマ
 *
 * @remarks
 * - 現在、UserProfileUpdateRequestSchemaと同一
 */
export const UserAuthRegisterRequestSchema = UserProfileUpdateRequestSchema

/**
 * ユーザープロフィール更新リクエストの型
 */
export type UserProfileUpdateRequest = z.infer<
  typeof UserProfileUpdateRequestSchema
>

/**
 * ユーザー認証登録リクエストの型
 */
export type UserAuthRegisterRequest = z.infer<
  typeof UserAuthRegisterRequestSchema
>

/**
 * ゲストユーザー登録リクエストのバリデーションスキーマ
 *
 * @remarks
 * - name: 省略可（省略時はサーバーでゲスト名を自動生成）
 */
export const GuestRegisterRequestSchema = z.object({
  name: z
    .string()
    .min(1, '名前は1文字以上である必要があります')
    .max(50, '名前は50文字以内である必要があります')
    .trim()
    .optional(),
})

export type GuestRegisterRequest = z.infer<typeof GuestRegisterRequestSchema>

/**
 * ゲストアカウントアップグレードリクエストのバリデーションスキーマ
 */
export const GuestUpgradeRequestSchema = z.object({
  name: z
    .string()
    .min(1, '名前は1文字以上である必要があります')
    .max(50, '名前は50文字以内である必要があります')
    .trim()
    .optional(),
})

export type GuestUpgradeRequest = z.infer<typeof GuestUpgradeRequestSchema>
