import { z } from 'zod'

/**
 * ツーリング登録リクエストのバリデーションスキーマ
 */
export const TouringRegisterRequestSchema = z
  .object({
    title: z
      .string({
        required_error: 'タイトルは必須です',
        invalid_type_error: 'タイトルは文字列で指定してください',
      })
      .min(1, 'タイトルは1文字以上で指定してください')
      .max(100, 'タイトルは100文字以内で指定してください')
      .trim(),
    startDate: z.coerce.date({
      required_error: '開始日は必須です',
      invalid_type_error: '開始日は日付形式で指定してください',
    }),
    endDate: z.coerce.date({
      required_error: '終了日は必須です',
      invalid_type_error: '終了日は日付形式で指定してください',
    }),
    startMileage: z
      .number({
        invalid_type_error: '開始時の総走行距離は数値で指定してください',
      })
      .int('開始時の総走行距離は整数で指定してください')
      .nonnegative('開始時の総走行距離は0以上で指定してください')
      .optional(),
    endMileage: z
      .number({
        invalid_type_error: '終了時の総走行距離は数値で指定してください',
      })
      .int('終了時の総走行距離は整数で指定してください')
      .nonnegative('終了時の総走行距離は0以上で指定してください')
      .optional(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: '開始日は終了日以前の日付で指定してください',
    path: ['startDate'],
  })
  .refine(
    (data) =>
      data.startMileage === undefined ||
      data.endMileage === undefined ||
      data.startMileage <= data.endMileage,
    {
      message:
        '開始時の総走行距離は終了時の総走行距離以下で指定してください',
      path: ['startMileage'],
    }
  )

export type TouringRegisterRequest = z.infer<
  typeof TouringRegisterRequestSchema
>

/**
 * ツーリング開始/終了リクエストのバリデーションスキーマ
 */
export const TouringStartEndRequestSchema = z
  .object({
    action: z.enum(['start', 'end'], {
      required_error: '操作は必須です',
      invalid_type_error: '操作は文字列で指定してください',
    }),
    touringId: z
      .string({
        invalid_type_error: 'ツーリングIDは文字列で指定してください',
      })
      .min(1, 'ツーリングIDは1文字以上で指定してください')
      .optional(),
    title: z
      .string({
        invalid_type_error: 'タイトルは文字列で指定してください',
      })
      .min(1, 'タイトルは1文字以上で指定してください')
      .max(100, 'タイトルは100文字以内で指定してください')
      .trim()
      .optional(),
    startDate: z.coerce
      .date({
        invalid_type_error: '開始日は日付形式で指定してください',
      })
      .optional(),
    endDate: z.coerce
      .date({
        invalid_type_error: '終了日は日付形式で指定してください',
      })
      .optional(),
    startMileage: z
      .number({
        invalid_type_error: '開始時の総走行距離は数値で指定してください',
      })
      .int('開始時の総走行距離は整数で指定してください')
      .nonnegative('開始時の総走行距離は0以上で指定してください')
      .optional(),
    endMileage: z
      .number({
        invalid_type_error: '終了時の総走行距離は数値で指定してください',
      })
      .int('終了時の総走行距離は整数で指定してください')
      .nonnegative('終了時の総走行距離は0以上で指定してください')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'end' && !data.touringId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ツーリングIDは必須です',
        path: ['touringId'],
      })
    }

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '開始日は終了日以前の日付で指定してください',
        path: ['startDate'],
      })
    }

    if (
      data.startMileage !== undefined &&
      data.endMileage !== undefined &&
      data.startMileage > data.endMileage
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          '開始時の総走行距離は終了時の総走行距離以下で指定してください',
        path: ['startMileage'],
      })
    }
  })

export type TouringStartEndRequest = z.infer<
  typeof TouringStartEndRequestSchema
>
