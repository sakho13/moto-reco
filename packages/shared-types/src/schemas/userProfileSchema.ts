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
 * ユーザープロフィール更新リクエストの型
 */
export type UserProfileUpdateRequest = z.infer<
  typeof UserProfileUpdateRequestSchema
>
