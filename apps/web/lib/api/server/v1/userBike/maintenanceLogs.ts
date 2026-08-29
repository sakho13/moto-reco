import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { MaintenanceLogSearchParams } from '@repo/shared-domain'
import {
  ApiResponseMaintenanceLogDetail,
  ApiResponseMaintenanceLogList,
  createMaintenanceLogId,
  createMyUserBikeId,
  MaintenanceLogListQuerySchema,
  MaintenanceLogRegisterRequestSchema,
  MaintenanceLogUpdateRequestSchema,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../../middlewares/honoAuth'
import {
  zodValidateJson,
  zodValidateQuery,
} from '../../middlewares/zodValidation'
import { PrismaMaintenanceLogRepository } from '../../repositories/PrismaMaintenanceLogRepository'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { MaintenanceLogService } from '../../services/MaintenanceLogService'

const userBikeMaintenanceLogs = new Hono().basePath(
  '/bike/:myUserBikeId/maintenance-logs'
)

userBikeMaintenanceLogs.get(
  '/',
  honoAuthMiddleware,
  zodValidateQuery(MaintenanceLogListQuerySchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const maintenanceLogRepo = new PrismaMaintenanceLogRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new MaintenanceLogService(
      maintenanceLogRepo,
      myUserBikeRepo
    )

    const searchParams = new MaintenanceLogSearchParams({
      page: query.page,
      pageSize: query['per-size'],
      sortOrder: query['sort-order'],
      keyword: query.keyword,
    })

    const logs = await service.getMaintenanceLogs({
      myUserBikeId: createMyUserBikeId(myUserBikeId),
      userId: userEntity.id,
      searchParams,
    })

    return c.json<SuccessResponse<ApiResponseMaintenanceLogList>>(
      {
        status: 'success',
        data: logs.map((log) => ({
          maintenanceLogId: log.id,
          performedAt: log.performedAt.toISOString(),
          mileage: log.mileage,
          memo: log.memo,
          items: log.items,
        })),
        message: 'メンテナンス履歴一覧取得成功',
      },
      200
    )
  }
)

userBikeMaintenanceLogs.post(
  '/',
  honoAuthMiddleware,
  zodValidateJson(MaintenanceLogRegisterRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction((t) => {
      const maintenanceLogRepo = new PrismaMaintenanceLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new MaintenanceLogService(
        maintenanceLogRepo,
        myUserBikeRepo
      )

      return service.registerMaintenanceLog({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        user: userEntity,
        performedAt: body.performedAt,
        mileage: body.mileage,
        memo: body.memo,
        items: body.items,
        updateTotalMileage: body.updateTotalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseMaintenanceLogDetail>>(
      {
        status: 'success',
        data: {
          maintenanceLogId: result.id,
          performedAt: result.performedAt.toISOString(),
          mileage: result.mileage,
          memo: result.memo,
          items: result.items,
        },
        message: 'メンテナンス履歴登録成功',
      },
      201
    )
  }
)

userBikeMaintenanceLogs.patch(
  '/',
  honoAuthMiddleware,
  zodValidateJson(MaintenanceLogUpdateRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction((t) => {
      const maintenanceLogRepo = new PrismaMaintenanceLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new MaintenanceLogService(
        maintenanceLogRepo,
        myUserBikeRepo
      )

      return service.updateMaintenanceLog({
        maintenanceLogId: createMaintenanceLogId(body.maintenanceLogId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: userEntity.id,
        performedAt: body.performedAt,
        mileage: body.mileage,
        memo: body.memo,
        items: body.items,
        updateTotalMileage: body.updateTotalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseMaintenanceLogDetail>>(
      {
        status: 'success',
        data: {
          maintenanceLogId: result.id,
          performedAt: result.performedAt.toISOString(),
          mileage: result.mileage,
          memo: result.memo,
          items: result.items,
        },
        message: 'メンテナンス履歴更新成功',
      },
      200
    )
  }
)

export default userBikeMaintenanceLogs
