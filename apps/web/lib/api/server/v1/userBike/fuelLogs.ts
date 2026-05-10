import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseFuelLogDetail,
  ApiResponseFuelLogList,
  createFuelLogId,
  createMyUserBikeId,
  createUserId,
  FuelLogDeleteRequestSchema,
  FuelLogDetailParamSchema,
  FuelLogListQuerySchema,
  FuelLogRegisterRequestSchema,
  FuelLogUpdateRequestSchema,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../../middlewares/honoAuth'
import {
  zodValidateJson,
  zodValidateParam,
  zodValidateQuery,
} from '../../middlewares/zodValidation'
import { PrismaFuelLogRepository } from '../../repositories/PrismaFuelLogRepository'
import { PrismaHistoryRepository } from '../../repositories/PrismaHistoryRepository'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { PrismaTouringRepository } from '../../repositories/PrismaTouringRepository'
import { PrismaUserBikeRepository } from '../../repositories/PrismaUserBikeRepository'
import { FuelLogService } from '../../services/FuelLogService'
import { FuelLogSearchParams } from '../../valueObjects/FuelLogSearchParams'

const userBikeFuelLogs = new Hono().basePath('/bike/:myUserBikeId/fuel-logs')

userBikeFuelLogs.get(
  '/',
  honoAuthMiddleware,
  zodValidateQuery(FuelLogListQuerySchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const searchParams = new FuelLogSearchParams({
      page: query.page,
      pageSize: query['per-size'],
      sortBy: query['sort-by'] === 'mileage' ? 'mileage' : 'refueledAt',
      sortOrder: query['sort-order'],
      period: query.period,
      startDate: query.startDate,
      endDate: query.endDate,
    })

    const fuelLogRepo = new PrismaFuelLogRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const userBikeRepo = new PrismaUserBikeRepository(prisma)
    const touringRepo = new PrismaTouringRepository(prisma)
    const fuelLogService = new FuelLogService(
      fuelLogRepo,
      myUserBikeRepo,
      userBikeRepo,
      touringRepo
    )

    const fuelLogs = await fuelLogService.getFuelLogs(
      createMyUserBikeId(myUserBikeId),
      createUserId(userId),
      searchParams
    )

    return c.json<SuccessResponse<ApiResponseFuelLogList>>(
      {
        status: 'success',
        data: fuelLogs.map((log) => {
          return {
            fuelLogId: log.id,
            refueledAt: log.refueledAt.toISOString(),
            mileage: log.mileage,
            previousMileage: log.previousMileage,
            amount: log.amount,
            totalPrice: log.totalPrice,
            memo: log.memo,
            fuelEfficiency: log.fuelEfficiency,
            pricePerLiter: log.pricePerLiter,
            touringId: log.touringId,
            touringTitle: log.touringTitle,
          }
        }),
        message: '燃料ログ一覧取得成功',
      },
      200
    )
  }
)

userBikeFuelLogs.get(
  '/:fuelLogId',
  honoAuthMiddleware,
  zodValidateParam(FuelLogDetailParamSchema),
  async (c) => {
    const { userId } = c.var.user!
    const params = c.req.valid('param')

    const fuelLogRepo = new PrismaFuelLogRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const userBikeRepo = new PrismaUserBikeRepository(prisma)
    const touringRepo = new PrismaTouringRepository(prisma)
    const fuelLogService = new FuelLogService(
      fuelLogRepo,
      myUserBikeRepo,
      userBikeRepo,
      touringRepo
    )

    const fuelLog = await fuelLogService.getFuelLogDetail(
      createFuelLogId(params.fuelLogId),
      createMyUserBikeId(params.myUserBikeId),
      createUserId(userId)
    )

    return c.json<SuccessResponse<ApiResponseFuelLogDetail>>({
      status: 'success',
      data: {
        fuelLogId: fuelLog.id,
        refueledAt: fuelLog.refueledAt.toISOString(),
        mileage: fuelLog.mileage,
        previousMileage: fuelLog.previousMileage,
        amount: fuelLog.amount,
        totalPrice: fuelLog.totalPrice,
        memo: fuelLog.memo,
        fuelEfficiency: fuelLog.fuelEfficiency,
        pricePerLiter: fuelLog.pricePerLiter,
        touringId: fuelLog.touringId,
        touringTitle: fuelLog.touringTitle,
      },
      message: '燃料ログ詳細取得成功',
    })
  }
)

userBikeFuelLogs.post(
  '/',
  honoAuthMiddleware,
  zodValidateJson(FuelLogRegisterRequestSchema),
  async (c) => {
    const { userId, role } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const userBikeRepo = new PrismaUserBikeRepository(t)
      const touringRepo = new PrismaTouringRepository(t)
      const service = new FuelLogService(
        fuelLogRepo,
        myUserBikeRepo,
        userBikeRepo,
        touringRepo
      )

      const fuelLog = await service.registerFuelLog({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        role,
        refueledAt: body.refueledAt,
        mileage: body.mileage,
        previousMileage: body.previousMileage,
        amount: body.amount,
        totalPrice: body.totalPrice,
        memo: body.memo,
        updateTotalMileage: body.updateTotalMileage,
      })

      const historyRepo = new PrismaHistoryRepository(t)
      await historyRepo.createHistory({
        userId: createUserId(userId),
        userMyBikeId: createMyUserBikeId(myUserBikeId),
        type: 'FUEL_LOG',
        occurredAt: fuelLog.refueledAt,
        fuelLogId: fuelLog.id,
      })

      return fuelLog
    })

    return c.json<SuccessResponse<ApiResponseFuelLogDetail>>(
      {
        status: 'success',
        data: {
          fuelLogId: result.id,
          refueledAt: result.refueledAt.toISOString(),
          mileage: result.mileage,
          previousMileage: result.previousMileage,
          amount: result.amount,
          totalPrice: result.totalPrice,
          memo: result.memo,
          fuelEfficiency: result.fuelEfficiency,
          pricePerLiter: result.pricePerLiter,
          touringId: result.touringId,
          touringTitle: result.touringTitle,
        },
        message: '燃料ログ登録成功',
      },
      201
    )
  }
)

userBikeFuelLogs.patch(
  '/',
  honoAuthMiddleware,
  zodValidateJson(FuelLogUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const userBikeRepo = new PrismaUserBikeRepository(t)
      const touringRepo = new PrismaTouringRepository(t)
      const historyRepo = new PrismaHistoryRepository(t)
      const service = new FuelLogService(
        fuelLogRepo,
        myUserBikeRepo,
        userBikeRepo,
        touringRepo
      )

      const updated = await service.updateFuelLog({
        fuelLogId: createFuelLogId(body.fuelLogId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        refueledAt: body.refueledAt,
        mileage: body.mileage,
        previousMileage: body.previousMileage,
        amount: body.amount,
        totalPrice: body.totalPrice,
        memo: body.memo,
      })

      // 給油日時が変更された場合、ヒストリーの occurredAt を更新
      if (body.refueledAt !== undefined) {
        await historyRepo.updateOccurredAtByFuelLogId(
          createFuelLogId(body.fuelLogId),
          updated.refueledAt
        )
      }

      return updated
    })

    return c.json<SuccessResponse<ApiResponseFuelLogDetail>>(
      {
        status: 'success',
        data: {
          fuelLogId: result.id,
          refueledAt: result.refueledAt.toISOString(),
          mileage: result.mileage,
          previousMileage: result.previousMileage,
          amount: result.amount,
          totalPrice: result.totalPrice,
          memo: result.memo,
          fuelEfficiency: result.fuelEfficiency,
          pricePerLiter: result.pricePerLiter,
          touringId: result.touringId,
          touringTitle: result.touringTitle,
        },
        message: '燃料ログ更新成功',
      },
      200
    )
  }
)

userBikeFuelLogs.delete(
  '/',
  honoAuthMiddleware,
  zodValidateJson(FuelLogDeleteRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    await prisma.$transaction((t) => {
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const userBikeRepo = new PrismaUserBikeRepository(t)
      const touringRepo = new PrismaTouringRepository(t)
      const service = new FuelLogService(
        fuelLogRepo,
        myUserBikeRepo,
        userBikeRepo,
        touringRepo
      )

      return service.deleteFuelLog({
        fuelLogId: createFuelLogId(body.fuelLogId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
      })
    })

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        message: '燃料ログ削除成功',
        data: undefined,
      },
      200
    )
  }
)

export default userBikeFuelLogs
