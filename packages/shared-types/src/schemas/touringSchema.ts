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
    status: z
      .enum(['PLANNED', 'STARTED', 'COMPLETED'], {
        invalid_type_error:
          'ステータスはPLANNED、STARTEDまたはCOMPLETEDで指定してください',
      })
      .default('COMPLETED')
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
      message: '開始時の総走行距離は終了時の総走行距離以下で指定してください',
      path: ['startMileage'],
    }
  )

export type TouringRegisterRequest = z.infer<
  typeof TouringRegisterRequestSchema
>

/**
 * ツーリング更新リクエストのバリデーションスキーマ
 */
export const TouringUpdateRequestSchema = z
  .object({
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
    status: z
      .enum(['PLANNED', 'STARTED', 'COMPLETED'], {
        invalid_type_error:
          'ステータスはPLANNED、STARTEDまたはCOMPLETEDで指定してください',
      })
      .optional(),
    fuelLogIds: z
      .array(
        z
          .string({
            invalid_type_error: '給油履歴IDは文字列で指定してください',
          })
          .min(1, '給油履歴IDは1文字以上で指定してください')
      )
      .optional(),
    startLatitude: z
      .number({
        invalid_type_error: '開始地点の緯度は数値で指定してください',
      })
      .min(-90, '開始地点の緯度は-90以上で指定してください')
      .max(90, '開始地点の緯度は90以下で指定してください')
      .nullable()
      .optional(),
    startLongitude: z
      .number({
        invalid_type_error: '開始地点の経度は数値で指定してください',
      })
      .min(-180, '開始地点の経度は-180以上で指定してください')
      .max(180, '開始地点の経度は180以下で指定してください')
      .nullable()
      .optional(),
    endLatitude: z
      .number({
        invalid_type_error: '終了地点の緯度は数値で指定してください',
      })
      .min(-90, '終了地点の緯度は-90以上で指定してください')
      .max(90, '終了地点の緯度は90以下で指定してください')
      .nullable()
      .optional(),
    endLongitude: z
      .number({
        invalid_type_error: '終了地点の経度は数値で指定してください',
      })
      .min(-180, '終了地点の経度は-180以上で指定してください')
      .max(180, '終了地点の経度は180以下で指定してください')
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.startDate !== undefined ||
      data.endDate !== undefined ||
      data.startMileage !== undefined ||
      data.endMileage !== undefined ||
      data.status !== undefined ||
      data.fuelLogIds !== undefined ||
      data.startLatitude !== undefined ||
      data.startLongitude !== undefined ||
      data.endLatitude !== undefined ||
      data.endLongitude !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )
  .refine(
    (data) =>
      data.startDate === undefined ||
      data.endDate === undefined ||
      data.startDate <= data.endDate,
    {
      message: '開始日は終了日以前の日付で指定してください',
      path: ['startDate'],
    }
  )
  .refine(
    (data) =>
      data.startMileage === undefined ||
      data.endMileage === undefined ||
      data.startMileage <= data.endMileage,
    {
      message: '開始時の総走行距離は終了時の総走行距離以下で指定してください',
      path: ['startMileage'],
    }
  )

export type TouringUpdateRequest = z.infer<typeof TouringUpdateRequestSchema>

/**
 * ツーリング開始/終了リクエストのバリデーションスキーマ
 */
const TouringStartRequestSchema = z.object({
  action: z.literal('start', {
    required_error: '操作は必須です',
  }),
  touringPlanId: z
    .string({
      invalid_type_error: 'ツーリングプランIDは文字列で指定してください',
    })
    .min(1, 'ツーリングプランIDは1文字以上で指定してください')
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
  startMileage: z
    .number({
      invalid_type_error: '開始時の総走行距離は数値で指定してください',
    })
    .int('開始時の総走行距離は整数で指定してください')
    .nonnegative('開始時の総走行距離は0以上で指定してください')
    .optional(),
  startLatitude: z
    .number({
      invalid_type_error: '開始地点の緯度は数値で指定してください',
    })
    .min(-90, '開始地点の緯度は-90以上で指定してください')
    .max(90, '開始地点の緯度は90以下で指定してください')
    .optional(),
  startLongitude: z
    .number({
      invalid_type_error: '開始地点の経度は数値で指定してください',
    })
    .min(-180, '開始地点の経度は-180以上で指定してください')
    .max(180, '開始地点の経度は180以下で指定してください')
    .optional(),
})

const TouringEndRequestSchema = z.object({
  action: z.literal('end', {
    required_error: '操作は必須です',
  }),
  touringId: z
    .string({
      required_error: 'ツーリングIDは必須です',
      invalid_type_error: 'ツーリングIDは文字列で指定してください',
    })
    .min(1, 'ツーリングIDは1文字以上で指定してください'),
  endDate: z.coerce
    .date({
      invalid_type_error: '終了日は日付形式で指定してください',
    })
    .optional(),
  endMileage: z
    .number({
      invalid_type_error: '終了時の総走行距離は数値で指定してください',
    })
    .int('終了時の総走行距離は整数で指定してください')
    .nonnegative('終了時の総走行距離は0以上で指定してください')
    .optional(),
  endLatitude: z
    .number({
      invalid_type_error: '終了地点の緯度は数値で指定してください',
    })
    .min(-90, '終了地点の緯度は-90以上で指定してください')
    .max(90, '終了地点の緯度は90以下で指定してください')
    .optional(),
  endLongitude: z
    .number({
      invalid_type_error: '終了地点の経度は数値で指定してください',
    })
    .min(-180, '終了地点の経度は-180以上で指定してください')
    .max(180, '終了地点の経度は180以下で指定してください')
    .optional(),
})

export const TouringStartEndRequestSchema = z.discriminatedUnion('action', [
  TouringStartRequestSchema,
  TouringEndRequestSchema,
])

export type TouringStartEndRequest = z.infer<
  typeof TouringStartEndRequestSchema
>

/**
 * ツーリング一覧取得クエリパラメータのバリデーションスキーマ
 */
export const TouringListQuerySchema = z.object({
  'sort-by': z.enum(['start-date', 'end-date']).optional(),
  'sort-order': z.enum(['asc', 'desc']).default('desc').optional(),
  status: z.enum(['PLANNED', 'STARTED', 'COMPLETED']).optional(),
})

export type TouringListQuery = z.infer<typeof TouringListQuerySchema>

/**
 * ツーリングステータス更新リクエストのバリデーションスキーマ
 */
export const TouringStatusUpdateRequestSchema = z.object({
  status: z.enum(['PLANNED', 'STARTED', 'COMPLETED'], {
    required_error: 'ステータスは必須です',
    invalid_type_error:
      'ステータスはPLANNED、STARTEDまたはCOMPLETEDで指定してください',
  }),
})

export type TouringStatusUpdateRequest = z.infer<
  typeof TouringStatusUpdateRequestSchema
>

/**
 * ツーリングに紐づく給油履歴更新リクエストのバリデーションスキーマ
 */
export const TouringFuelLogsUpdateRequestSchema = z.object({
  fuelLogIds: z
    .array(
      z
        .string({
          invalid_type_error: '給油履歴IDは文字列で指定してください',
        })
        .min(1, '給油履歴IDは1文字以上で指定してください')
    )
    .default([]),
})

export type TouringFuelLogsUpdateRequest = z.infer<
  typeof TouringFuelLogsUpdateRequestSchema
>

/**
 * ツーリング削除リクエストのバリデーションスキーマ
 */
export const TouringDeleteRequestSchema = z.object({
  touringId: z
    .string({
      required_error: 'ツーリングIDは必須です',
      invalid_type_error: 'ツーリングIDは文字列で指定してください',
    })
    .min(1, 'ツーリングIDは1文字以上で指定してください'),
})

export type TouringDeleteRequest = z.infer<typeof TouringDeleteRequestSchema>
