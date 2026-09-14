import { z } from 'zod'
import { MAINTENANCE_TYPES } from '../domain/maintenance'

/**
 * 点検予定取得クエリパラメータのバリデーションスキーマ
 */
export const MaintenanceScheduleQuerySchema = z.object({
  limit: z.coerce
    .number({
      invalid_type_error: 'limitは数値で指定してください',
    })
    .int('limitは整数で指定してください')
    .min(1, 'limitは1以上で指定してください')
    .max(
      MAINTENANCE_TYPES.length,
      `limitは${MAINTENANCE_TYPES.length}以下で指定してください`
    )
    .optional(),
})

export type MaintenanceScheduleQuery = z.infer<
  typeof MaintenanceScheduleQuerySchema
>
