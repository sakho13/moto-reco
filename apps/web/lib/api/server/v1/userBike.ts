import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseUserBikeList,
  ApiResponseUserBikeDetail,
  ApiResponseFuelLogDetail,
  ApiResponseFuelLogList,
  createBikeId,
  createFuelLogId,
  createMyUserBikeId,
  createUserId,
  SuccessResponse,
  UserBikeRegisterRequestSchema,
  UserBikeUpdateRequestSchema,
  UserBikeListQuerySchema,
  FuelLogRegisterRequestSchema,
  FuelLogUpdateRequestSchema,
  FuelLogListQuerySchema,
} from '@repo/shared-types'
import { MyUserBikeDetail } from '../interfaces/IMyUserBikeRepository'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson, zodValidateQuery } from '../middlewares/zodValidation'
import { PrismaBikeRepository } from '../repositories/PrismaBikeRepository'
import { PrismaFuelLogRepository } from '../repositories/PrismaFuelLogRepository'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaUserBikeRepository } from '../repositories/PrismaUserBikeRepository'
import { FuelLogService } from '../services/FuelLogService'
import { UserBikeService } from '../services/UserBikeService'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'
import { UserBikeSearchParams } from '../valueObjects/UserBikeSearchParams'

const userBike = new Hono()

const toApiResponseUserBikeDetail = (
  detail: MyUserBikeDetail
): ApiResponseUserBikeDetail => ({
  userBikeId: detail.userBikeId,
  myUserBikeId: detail.myUserBikeId,
  manufacturerName: detail.manufacturerName,
  bikeId: detail.bikeId ?? null,
  modelName: detail.modelName,
  nickname: detail.nickname,
  purchaseDate: detail.purchaseDate?.toISOString() ?? null,
  purchasePrice: detail.purchasePrice,
  purchaseMileage: detail.purchaseMileage,
  totalMileage: detail.totalMileage,
  displacement: detail.displacement,
  modelYear: detail.modelYear,
  createdAt: detail.createdAt.toISOString(),
  updatedAt: detail.updatedAt.toISOString(),
})

userBike.post(
  '/register',
  honoAuthMiddleware,
  zodValidateJson(UserBikeRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json')

    const detail = await prisma.$transaction(async (t) => {
      const userBikeRepo = new PrismaUserBikeRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const bikeRepo = new PrismaBikeRepository(t)
      const service = new UserBikeService(
        userBikeRepo,
        myUserBikeRepo,
        bikeRepo
      )

      const { myUserBike } = await service.registerUserBike({
        bikeId: body.bikeId ? createBikeId(body.bikeId) : null,
        displacement: body.displacement,
        serialNumber: body.serialNumber,
        userId,
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
        totalMileage: body.totalMileage,
      })

      return service.getMyUserBikeDetail(myUserBike.id, createUserId(userId))
    })

    return c.json<SuccessResponse<ApiResponseUserBikeDetail>>(
      {
        status: 'success',
        data: toApiResponseUserBikeDetail(detail),
        message: 'ユーザーバイク登録成功',
      },
      201
    )
  }
)

userBike.get(
  '/bikes',
  honoAuthMiddleware,
  zodValidateQuery(UserBikeListQuerySchema),
  async (c) => {
    const { userId } = c.var.user!
    const query = c.req.valid('query')

    const searchParams = new UserBikeSearchParams({
      sortBy: query['sort-by'] === 'created-at' ? 'createdAt' : 'updatedAt',
      sortOrder: query['sort-order'],
    })

    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const bikes = await myUserBikeRepo.findMyUserBikes(
      createUserId(userId),
      searchParams
    )

    return c.json<SuccessResponse<ApiResponseUserBikeList>>({
      status: 'success',
      data: {
        bikes: bikes.map(toApiResponseUserBikeDetail),
      },
      message: 'ユーザー所有バイク一覧取得成功',
    })
  }
)

userBike.get('/bike/:myUserBikeId', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  const detail = await prisma.$transaction((t) => {
    const userBikeRepo = new PrismaUserBikeRepository(t)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
    const bikeRepo = new PrismaBikeRepository(t)
    const service = new UserBikeService(userBikeRepo, myUserBikeRepo, bikeRepo)

    return service.getMyUserBikeDetail(
      c.req.param('myUserBikeId'),
      createUserId(userId)
    )
  })

  return c.json<SuccessResponse<ApiResponseUserBikeDetail>>({
    status: 'success',
    data: toApiResponseUserBikeDetail(detail),
    message: 'ユーザー所有バイク詳細取得成功',
  })
})

userBike.patch(
  '/bike/:myUserBikeId',
  honoAuthMiddleware,
  zodValidateJson(UserBikeUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json')

    const detail = await prisma.$transaction((t) => {
      const userBikeRepo = new PrismaUserBikeRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const bikeRepo = new PrismaBikeRepository(t)
      const service = new UserBikeService(
        userBikeRepo,
        myUserBikeRepo,
        bikeRepo
      )

      return service.updateMyUserBike({
        myUserBikeId: createMyUserBikeId(c.req.param('myUserBikeId')),
        userId: createUserId(userId),
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
        totalMileage: body.totalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserBikeDetail>>({
      status: 'success',
      data: toApiResponseUserBikeDetail(detail),
      message: 'ユーザー所有バイク情報更新成功',
    })
  }
)

userBike.get(
  '/bike/:myUserBikeId/fuel-logs',
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
    })

    const fuelLogRepo = new PrismaFuelLogRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const fuelLogService = new FuelLogService(fuelLogRepo, myUserBikeRepo)

    const fuelLogs = await fuelLogService.getFuelLogs(
      createMyUserBikeId(myUserBikeId),
      createUserId(userId),
      searchParams
    )

    return c.json<SuccessResponse<ApiResponseFuelLogList>>(
      {
        status: 'success',
        data: fuelLogs.map((log) => ({
          fuelLogId: log.id,
          refueledAt: log.refueledAt.toISOString(),
          mileage: log.mileage,
          amount: log.amount,
          totalPrice: log.totalPrice,
        })),
        message: '燃料ログ一覧取得成功',
      },
      200
    )
  }
)

userBike.post(
  '/bike/:myUserBikeId/fuel-logs',
  honoAuthMiddleware,
  zodValidateJson(FuelLogRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction((t) => {
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new FuelLogService(fuelLogRepo, myUserBikeRepo)

      return service.registerFuelLog({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        refueledAt: body.refueledAt,
        mileage: body.mileage,
        amount: body.amount,
        totalPrice: body.totalPrice,
        updateTotalMileage: body.updateTotalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseFuelLogDetail>>(
      {
        status: 'success',
        data: {
          fuelLogId: result.id,
          refueledAt: result.refueledAt.toISOString(),
          mileage: result.mileage,
          amount: result.amount,
          totalPrice: result.totalPrice,
        },
        message: '燃料ログ登録成功',
      },
      201
    )
  }
)

userBike.patch(
  '/bike/:myUserBikeId/fuel-logs',
  honoAuthMiddleware,
  zodValidateJson(FuelLogUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction((t) => {
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new FuelLogService(fuelLogRepo, myUserBikeRepo)

      return service.updateFuelLog({
        fuelLogId: createFuelLogId(body.fuelLogId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        refueledAt: body.refueledAt,
        mileage: body.mileage,
        amount: body.amount,
        totalPrice: body.totalPrice,
      })
    })

    return c.json<SuccessResponse<ApiResponseFuelLogDetail>>(
      {
        status: 'success',
        data: {
          fuelLogId: result.id,
          refueledAt: result.refueledAt.toISOString(),
          mileage: result.mileage,
          amount: result.amount,
          totalPrice: result.totalPrice,
        },
        message: '燃料ログ更新成功',
      },
      200
    )
  }
)

export default userBike
