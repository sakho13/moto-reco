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
 * ユーザー復帰リクエストのバリデーションスキーマ
 *
 * @remarks
 * - recoveryCode: 5桁の数字
 */
export const UserAuthRecoverRequestSchema = z.object({
  recoveryCode: z
    .string({
      required_error: '復帰コードは必須です',
      invalid_type_error: '復帰コードは文字列である必要があります',
    })
    .trim()
    .length(5, '復帰コードは5桁である必要があります')
    .regex(/^\d{5}$/, '復帰コードは5桁の数字である必要があります'),
})

/**
 * ユーザー退会リクエストの型
 */
export type UserAuthQuitRequest = z.infer<typeof UserAuthQuitRequestSchema>

/**
 * ユーザー復帰リクエストの型
 */
export type UserAuthRecoverRequest = z.infer<
  typeof UserAuthRecoverRequestSchema
>
