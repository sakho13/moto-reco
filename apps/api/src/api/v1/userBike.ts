import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseUserBikeRegister,
  ApiResponseUserBikeList,
  ApiResponseUserBikeDetail,
  createBikeId,
  createMyUserBikeId,
  createUserId,
  SuccessResponse,
  UserBikeRegisterRequestSchema,
  UserBikeUpdateRequestSchema,
} from '@shared-types/index'
import { PrismaBikeRepository } from '../../lib/classes/repositories/PrismaBikeRepository'
import { PrismaMyUserBikeRepository } from '../../lib/classes/repositories/PrismaMyUserBikeRepository'
import { PrismaUserBikeRepository } from '../../lib/classes/repositories/PrismaUserBikeRepository'
import { UserBikeService } from '../../lib/classes/services/UserBikeService'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'
import { zodValidateJson } from '../../lib/middlewares/zodValidation'

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

export default userBike
