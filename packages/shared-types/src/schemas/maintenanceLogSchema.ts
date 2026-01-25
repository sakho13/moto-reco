import { z } from 'zod'

const MaintenanceTypeSchema = z.enum([
  'BRAKE_FLUID',
  'FRONT_BRAKE_PAD',
  'REAR_BRAKE_PAD',
  'MASTER_CYLINDER_CUP',
  'BRAKE_CALIPER_SEAL',
  'BRAKE_CABLE',
  'SPARK_PLUG',
  'COOLANT',
  'ENGINE_OIL',
  'OIL_CLEANER',
  'TRANSMISSION_OIL',
  'DRIVE_CHAIN',
  'DRIVE_BELT',
  'FRONT_TIRE',
  'REAR_TIRE',
  'BATTERY',
  'LIGHT',
  'TURN_SIGNAL',
  'HORN',
])

const MaintenanceLogItemSchema = z.object({
  type: MaintenanceTypeSchema,
  value: z
    .string({
      required_error: 'メンテナンス項目の値は必須です',
      invalid_type_error: 'メンテナンス項目の値は文字列で指定してください',
    })
    .trim()
    .min(1, 'メンテナンス項目の値は1文字以上で指定してください')
    .max(500, 'メンテナンス項目の値は500文字以内で指定してください'),
})

const hasDuplicateMaintenanceType = (items: Array<{ type: string }>): boolean => {
  const typeSet = new Set(items.map((item) => item.type))
  return typeSet.size !== items.length
}

/**
 * メンテナンス履歴登録リクエストのバリデーションスキーマ
 */
export const MaintenanceLogRegisterRequestSchema = z
  .object({
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
  })
  .refine((data) => !hasDuplicateMaintenanceType(data.items), {
    message: 'メンテナンス項目が重複しています',
    path: ['items'],
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
  .refine((data) => (data.items ? !hasDuplicateMaintenanceType(data.items) : true), {
    message: 'メンテナンス項目が重複しています',
    path: ['items'],
  })

export type MaintenanceLogUpdateRequest = z.infer<
  typeof MaintenanceLogUpdateRequestSchema
>
