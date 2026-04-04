import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponsePublicBikeList,
  ApiResponsePublicTouringList,
  createMyUserBikeId,
  SuccessResponse,
} from '@repo/shared-types'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaTouringRepository } from '../repositories/PrismaTouringRepository'

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

publicRoute.get('/bikes/:bikeId/tourings', async (c) => {
  const { bikeId } = c.req.param()
  const touringRepo = new PrismaTouringRepository(prisma)
  const tourings = await touringRepo.findPublicTouringsByBikeId(
    createMyUserBikeId(bikeId)
  )

  return c.json<SuccessResponse<ApiResponsePublicTouringList>>({
    status: 'success',
    data: {
      tourings: tourings.map((t) => ({
        touringId: t.touringId,
        title: t.title,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        startMileage: t.startMileage,
        endMileage: t.endMileage,
        status: t.status,
      })),
    },
    message: '公開ツーリング一覧取得成功',
  })
})

export default publicRoute
