import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { ApiResponsePublicBikeList, SuccessResponse } from '@repo/shared-types'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'

const publicRoute = new Hono()

publicRoute.get('/bikes', async (c) => {
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const bikes = await myUserBikeRepo.findPublicBikes()

  return c.json<SuccessResponse<ApiResponsePublicBikeList>>({
    status: 'success',
    data: {
      bikes: bikes.map((bike) => ({
        myUserBikeId: bike.myUserBikeId,
        manufacturerName: bike.manufacturerName,
        modelName: bike.modelName,
        nickname: bike.nickname,
        displacement: bike.displacement,
        modelYear: bike.modelYear,
        totalMileage: bike.totalMileage,
        updatedAt: bike.updatedAt.toISOString(),
      })),
    },
    message: '公開バイク一覧取得成功',
  })
})

export default publicRoute
