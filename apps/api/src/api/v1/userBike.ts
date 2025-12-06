import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseMyUserBikeFuelLogDetail,
  ApiResponseUserBikeRegister,
  ApiResponseUserBikeList,
  createMyUserBikeId,
  createBikeId,
  createUserId,
  SuccessResponse,
  MyUserBikeFuelLogRegisterRequestSchema,
  UserBikeRegisterRequestSchema,
} from '@shared-types/index'
import { z } from 'zod'
import { PrismaBikeRepository } from '../../lib/classes/repositories/PrismaBikeRepository'
import { PrismaMyUserBikeFuelLogRepository } from '../../lib/classes/repositories/PrismaMyUserBikeFuelLogRepository'
import { PrismaMyUserBikeRepository } from '../../lib/classes/repositories/PrismaMyUserBikeRepository'
import { PrismaUserBikeRepository } from '../../lib/classes/repositories/PrismaUserBikeRepository'
import { MyUserBikeFuelLogService } from '../../lib/classes/services/MyUserBikeFuelLogService'
import { UserBikeService } from '../../lib/classes/services/UserBikeService'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'
import { zodValidateJson, zodValidateParam } from '../../lib/middlewares/zodValidation'

const userBike = new Hono()

const myUserBikeIdParamSchema = z.object({
  myUserBikeId: z
    .string({
      required_error: 'ユーザー所有バイクIDは必須です',
      invalid_type_error: 'ユーザー所有バイクIDは文字列で指定してください',
    })
    .min(1, 'ユーザー所有バイクIDは1文字以上で指定してください'),
})

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

userBike.get('/bike/:userBikeId', honoAuthMiddleware, async (c) => {
  return c.json({})
})

userBike.post(
  '/bike/:myUserBikeId/fuel-logs',
  honoAuthMiddleware,
  zodValidateParam(myUserBikeIdParamSchema),
  zodValidateJson(MyUserBikeFuelLogRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const { myUserBikeId } = c.req.valid('param')
    const body = c.req.valid('json')

    const fuelLog = await prisma.$transaction((t) => {
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const fuelLogRepo = new PrismaMyUserBikeFuelLogRepository(t)
      const service = new MyUserBikeFuelLogService(myUserBikeRepo, fuelLogRepo)

      return service.registerFuelLog({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId,
        refueledAt: body.refueledAt,
        mileage: body.mileage,
        amount: body.amount,
        totalPrice: body.totalPrice,
        updateTotalMileage: body.updateTotalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseMyUserBikeFuelLogDetail>>(
      {
        status: 'success',
        data: {
          fuelLogId: fuelLog.id,
          refueledAt: fuelLog.refueledAt.toISOString(),
          mileage: fuelLog.mileage,
          amount: fuelLog.amount,
          totalPrice: fuelLog.totalPrice,
        },
        message: '燃料ログ登録成功',
      },
      201
    )
  }
)

export default userBike
