import { z } from 'zod'

/**
 * ユーザー退会リクエストのバリデーションスキーマ
 *
 * @remarks
 * - quitReason: 1文字以上200文字以下
 */
export const UserAuthQuitRequestSchema = z.object({
  quitReason: z
    .string({
      required_error: '退会理由は必須です',
      invalid_type_error: '退会理由は文字列である必要があります',
    })
    .min(1, '退会理由は1文字以上である必要があります')
    .max(200, '退会理由は200文字以内である必要があります')
    .trim(),
})

/**
 * ユーザー退会リクエストの型
 */
export type UserAuthQuitRequest = z.infer<typeof UserAuthQuitRequestSchema>
