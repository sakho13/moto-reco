import { z } from 'zod'

/**
 * ユーザープロフィール更新リクエストのバリデーションスキーマ
 *
 * @remarks
 * - name: 1文字以上50文字以下の文字列
 * - notificationEmail: 通知用メールアドレス（省略可、nullで削除）
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
  notificationEmail: z
    .string({
      invalid_type_error: '通知メールアドレスは文字列である必要があります',
    })
    .email('有効なメールアドレスを入力してください')
    .nullable()
    .optional(),
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
 * ユーザープロフィール部分更新リクエストのバリデーションスキーマ（PATCH用）
 *
 * @remarks
 * - name: 省略可、指定時は1文字以上50文字以下
 * - notificationEmail: 省略可、nullで削除
 * - 少なくとも1フィールドの指定が必須
 */
export const UserProfilePatchRequestSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: '名前は文字列である必要があります',
      })
      .min(1, '名前は1文字以上である必要があります')
      .max(50, '名前は50文字以内である必要があります')
      .trim()
      .optional(),
    notificationEmail: z
      .string({
        invalid_type_error: '通知メールアドレスは文字列である必要があります',
      })
      .email('有効なメールアドレスを入力してください')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.notificationEmail !== undefined,
    { message: '少なくとも1つのフィールドを指定してください' }
  )

/**
 * ユーザープロフィール部分更新リクエストの型
 */
export type UserProfilePatchRequest = z.infer<
  typeof UserProfilePatchRequestSchema
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
    .trim()
    .min(1, '名前は1文字以上である必要があります')
    .max(50, '名前は50文字以内である必要があります')
    .optional(),
})

export type GuestRegisterRequest = z.infer<typeof GuestRegisterRequestSchema>
