import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseUserBikeRegister,
  ApiResponseUserBikeList,
  ApiResponseUserBikeDetail,
  ApiResponseFuelLogDetail,
  ApiResponseFuelLogList,
  createBikeId,
  createMyUserBikeId,
  createUserId,
  SuccessResponse,
  UserBikeRegisterRequestSchema,
  UserBikeUpdateRequestSchema,
  FuelLogRegisterRequestSchema,
  FuelLogListQuerySchema,
} from '@shared-types/index'
import { PrismaBikeRepository } from '../../lib/classes/repositories/PrismaBikeRepository'
import { PrismaFuelLogRepository } from '../../lib/classes/repositories/PrismaFuelLogRepository'
import { PrismaMyUserBikeRepository } from '../../lib/classes/repositories/PrismaMyUserBikeRepository'
import { PrismaUserBikeRepository } from '../../lib/classes/repositories/PrismaUserBikeRepository'
import { FuelLogService } from '../../lib/classes/services/FuelLogService'
import { UserBikeService } from '../../lib/classes/services/UserBikeService'
import { FuelLogSearchParams } from '../../lib/classes/valueObjects/FuelLogSearchParams'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'
import { zodValidateJson, zodValidateQuery } from '../../lib/middlewares/zodValidation'

const userBike = new Hono()

userBike.post(
  '/register',
  honoAuthMiddleware,
  zodValidateJson(UserBikeRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json')

    const result = await prisma.$transaction((t) => {
      const userBikeRepo = new PrismaUserBikeRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const bikeRepo = new PrismaBikeRepository(t)
      const service = new UserBikeService(userBikeRepo, myUserBikeRepo, bikeRepo)

      return service.registerUserBike({
        bikeId: createBikeId(body.bikeId),
        serialNumber: body.serialNumber,
        userId,
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
        totalMileage: body.totalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserBikeRegister>>(
      {
        status: 'success',
        data: {
          userBikeId: result.userBike.id,
          myUserBikeId: result.myUserBike.id,
        },
        message: 'ユーザーバイク登録成功',
      },
      201
    )
  }
)

userBike.get('/bikes', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)

  const bikes = await myUserBikeRepo.findMyUserBikes(createUserId(userId))

  return c.json<SuccessResponse<ApiResponseUserBikeList>>({
    status: 'success',
    data: {
      bikes: bikes.map((bike) => ({
        userBikeId: bike.userBikeId,
        myUserBikeId: bike.myUserBikeId,
        manufacturerName: bike.manufacturerName,
        bikeId: bike.bikeId,
        modelName: bike.modelName,
        nickname: bike.nickname,
        purchaseDate: bike.purchaseDate?.toISOString() ?? null,
        purchasePrice: bike.purchasePrice,
        purchaseMileage: bike.purchaseMileage,
        totalMileage: bike.totalMileage,
        displacement: bike.displacement,
        modelYear: bike.modelYear,
        createdAt: bike.createdAt.toISOString(),
        updatedAt: bike.updatedAt.toISOString(),
      })),
    },
    message: 'ユーザー所有バイク一覧取得成功',
  })
})

userBike.get('/bike/:myUserBikeId', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  const detail = await prisma.$transaction((t) => {
    const userBikeRepo = new PrismaUserBikeRepository(t)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
    const bikeRepo = new PrismaBikeRepository(t)
    const service = new UserBikeService(userBikeRepo, myUserBikeRepo, bikeRepo)

    return service.getMyUserBikeDetail(c.req.param('myUserBikeId'), createUserId(userId))
  })

  return c.json<SuccessResponse<ApiResponseUserBikeDetail>>({
    status: 'success',
    data: {
      userBikeId: detail.userBikeId,
      myUserBikeId: detail.myUserBikeId,
      manufacturerName: detail.manufacturerName,
      bikeId: detail.bikeId,
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
    },
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
      const service = new UserBikeService(userBikeRepo, myUserBikeRepo, bikeRepo)

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
      data: {
        userBikeId: detail.userBikeId,
        myUserBikeId: detail.myUserBikeId,
        manufacturerName: detail.manufacturerName,
        bikeId: detail.bikeId,
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
      },
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

export default userBike
