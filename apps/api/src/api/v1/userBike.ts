import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseUserBikeRegister,
  createBikeId,
  SuccessResponse,
  UserBikeRegisterRequestSchema,
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
  return c.json({})
})

userBike.get('/bike/:userBikeId', honoAuthMiddleware, async (c) => {
  return c.json({})
})

export default userBike
