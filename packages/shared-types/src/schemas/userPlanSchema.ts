import { z } from 'zod'

export const ChangePlanRequestSchema = z.object({
  targetUserId: z
    .string({
      required_error: '対象ユーザーIDは必須です',
      invalid_type_error: '対象ユーザーIDは文字列で指定してください',
    })
    .min(1, '対象ユーザーIDは1文字以上で指定してください'),
  plan: z.enum(['FREE', 'PREMIUM'], {
    required_error: 'プランは必須です',
    invalid_type_error: 'プランは FREE または PREMIUM で指定してください',
  }),
  reason: z
    .string()
    .max(200, '変更理由は200文字以内で指定してください')
    .nullable()
    .optional(),
})

export type ChangePlanRequest = z.infer<typeof ChangePlanRequestSchema>
