import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseMaintenanceScheduleList,
  createMyUserBikeId,
  MaintenanceScheduleQuerySchema,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../../middlewares/honoAuth'
import { zodValidateQuery } from '../../middlewares/zodValidation'
import { PrismaMaintenanceLogRepository } from '../../repositories/PrismaMaintenanceLogRepository'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { MaintenanceScheduleService } from '../../services/MaintenanceScheduleService'

const userBikeMaintenanceSchedule = new Hono().basePath(
  '/bike/:myUserBikeId/maintenance-schedule'
)

/**
 * GET /api/v1/user-bike/bike/:myUserBikeId/maintenance-schedule
 *
 * 点検予定（メンテナンス項目ごとの次回時期）を、残りが少ない順に取得する。
 * クエリパラメータ:
 *   - limit: 上位N件に絞る（任意）
 */
userBikeMaintenanceSchedule.get(
  '/',
  honoAuthMiddleware,
  zodValidateQuery(MaintenanceScheduleQuerySchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const maintenanceLogRepo = new PrismaMaintenanceLogRepository(prisma)
    const service = new MaintenanceScheduleService(
      myUserBikeRepo,
      maintenanceLogRepo
    )

    const forecasts = await service.getMaintenanceSchedule({
      myUserBikeId: createMyUserBikeId(myUserBikeId),
      userId: userEntity.id,
      limit: query.limit,
    })

    return c.json<SuccessResponse<ApiResponseMaintenanceScheduleList>>(
      {
        status: 'success',
        data: forecasts.map((forecast) => ({
          type: forecast.type,
          category: forecast.category,
          typeName: forecast.typeName,
          categoryName: forecast.categoryName,
          basis: forecast.basis,
          remainingMileage: forecast.remainingMileage,
          dueDate: forecast.dueDate?.toISOString() ?? null,
          remainingDays: forecast.remainingDays,
          lastRecord: forecast.lastRecord
            ? {
                performedAt: forecast.lastRecord.performedAt.toISOString(),
                mileage: forecast.lastRecord.mileage,
              }
            : null,
          status: forecast.status,
        })),
        message: '点検予定取得成功',
      },
      200
    )
  }
)

export default userBikeMaintenanceSchedule
