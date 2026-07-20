import { z } from 'zod'
import { MAINTENANCE_TYPES } from '../domain/maintenance'

const MaintenanceTypeSchema = z.enum(MAINTENANCE_TYPES)

const MaintenanceLogItemSchema = z.object({
  maintenanceType: MaintenanceTypeSchema,
  value: z
    .number({
      invalid_type_error: 'メンテナンス値は数値で指定してください',
    })
    .nonnegative('メンテナンス値は0以上で指定してください')
    .nullable(),
})

/**
 * メンテナンス履歴登録リクエストのバリデーションスキーマ
 */
export const MaintenanceLogRegisterRequestSchema = z.object({
  performedAt: z.coerce.date({
    required_error: 'メンテナンス日時は必須です',
    invalid_type_error: 'メンテナンス日時は日付形式で指定してください',
  }),
  mileage: z
    .number({
      required_error: '走行距離は必須です',
      invalid_type_error: '走行距離は数値で指定してください',
    })
    .int('走行距離は整数で指定してください')
    .nonnegative('走行距離は0以上で指定してください'),
  memo: z
    .string({
      invalid_type_error: 'メモは文字列で指定してください',
    })
    .max(500, 'メモは500文字以内で指定してください')
    .nullable()
    .optional(),
  items: z
    .array(MaintenanceLogItemSchema)
    .min(1, 'メンテナンス項目は1件以上指定してください'),
  updateTotalMileage: z.boolean().default(false),
})

export type MaintenanceLogRegisterRequest = z.infer<
  typeof MaintenanceLogRegisterRequestSchema
>

/**
 * メンテナンス履歴更新リクエストのバリデーションスキーマ
 */
export const MaintenanceLogUpdateRequestSchema = z
  .object({
    maintenanceLogId: z
      .string({
        required_error: 'メンテナンス履歴IDは必須です',
        invalid_type_error: 'メンテナンス履歴IDは文字列で指定してください',
      })
      .min(1, 'メンテナンス履歴IDは1文字以上で指定してください'),
    performedAt: z.coerce
      .date({
        invalid_type_error: 'メンテナンス日時は日付形式で指定してください',
      })
      .optional(),
    mileage: z
      .number({
        invalid_type_error: '走行距離は数値で指定してください',
      })
      .int('走行距離は整数で指定してください')
      .nonnegative('走行距離は0以上で指定してください')
      .optional(),
    memo: z
      .string({
        invalid_type_error: 'メモは文字列で指定してください',
      })
      .max(500, 'メモは500文字以内で指定してください')
      .nullable()
      .optional(),
    items: z
      .array(MaintenanceLogItemSchema)
      .min(1, 'メンテナンス項目は1件以上指定してください')
      .optional(),
    updateTotalMileage: z.boolean().default(false).optional(),
  })
  .refine(
    (data) =>
      data.performedAt !== undefined ||
      data.mileage !== undefined ||
      data.memo !== undefined ||
      data.items !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )

export type MaintenanceLogUpdateRequest = z.infer<
  typeof MaintenanceLogUpdateRequestSchema
>

/**
 * メンテナンス履歴一覧取得クエリのバリデーションスキーマ
 */
export const MaintenanceLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  'per-size': z.coerce.number().int().min(1).max(100).default(20).optional(),
  'sort-order': z.enum(['asc', 'desc']).default('desc').optional(),
  keyword: z
    .string({
      invalid_type_error: 'キーワードは文字列で指定してください',
    })
    .trim()
    .min(1, 'キーワードは1文字以上で指定してください')
    .optional(),
})

export type MaintenanceLogListQuery = z.infer<
  typeof MaintenanceLogListQuerySchema
>
