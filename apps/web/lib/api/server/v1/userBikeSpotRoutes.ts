import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseSpotDetail,
  ApiResponseSpotList,
  createMyUserBikeId,
  createSpotId,
  createTouringId,
  createUserId,
  SpotRegisterRequestSchema,
  SpotReorderRequestSchema,
  SpotUpdateRequestSchema,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaSpotRepository } from '../repositories/PrismaSpotRepository'
import { PrismaTouringRepository } from '../repositories/PrismaTouringRepository'
import { SpotService } from '../services/SpotService'

export const registerUserBikeSpotRoutes = (userBike: Hono) => {
// スポット登録
userBike.post(
  '/bike/:myUserBikeId/tourings/:touringId/spots',
  honoAuthMiddleware,
  zodValidateJson(SpotRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const touringId = c.req.param('touringId')
    const body = c.req.valid('json')

    const spotRepo = new PrismaSpotRepository(prisma)
    const touringRepo = new PrismaTouringRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new SpotService(spotRepo, touringRepo, myUserBikeRepo)

    const spot = await service.registerSpot({
      touringId: createTouringId(touringId),
      myUserBikeId: createMyUserBikeId(myUserBikeId),
      userId: createUserId(userId),
      type: body.type,
      name: body.name,
      memo: body.memo,
      latitude: body.latitude,
      longitude: body.longitude,
      visitedAt: body.visitedAt,
      endAt: body.endAt,
    })

    return c.json<SuccessResponse<ApiResponseSpotDetail>>(
      {
        status: 'success',
        data: {
          spotId: spot.id,
          touringId: spot.touringId,
          type: spot.type,
          name: spot.name,
          memo: spot.memo,
          latitude: spot.latitude,
          longitude: spot.longitude,
          visitedAt: spot.visitedAt.toISOString(),
          endAt: spot.endAt?.toISOString() ?? null,
          sortOrder: spot.sortOrder,
        },
        message: 'スポット登録成功',
      },
      201
    )
  }
)

// スポット一覧取得
userBike.get(
  '/bike/:myUserBikeId/tourings/:touringId/spots',
  honoAuthMiddleware,
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const touringId = c.req.param('touringId')

    const spotRepo = new PrismaSpotRepository(prisma)
    const touringRepo = new PrismaTouringRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new SpotService(spotRepo, touringRepo, myUserBikeRepo)

    const spots = await service.getSpots(
      createTouringId(touringId),
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )

    return c.json<SuccessResponse<ApiResponseSpotList>>(
      {
        status: 'success',
        data: spots.map((spot) => ({
          spotId: spot.id,
          touringId: spot.touringId,
          type: spot.type,
          name: spot.name,
          memo: spot.memo,
          latitude: spot.latitude,
          longitude: spot.longitude,
          visitedAt: spot.visitedAt.toISOString(),
          endAt: spot.endAt?.toISOString() ?? null,
          sortOrder: spot.sortOrder,
        })),
        message: 'スポット一覧取得成功',
      },
      200
    )
  }
)

// スポット並び替え（/:spotId より前に定義）
userBike.patch(
  '/bike/:myUserBikeId/tourings/:touringId/spots/reorder',
  honoAuthMiddleware,
  zodValidateJson(SpotReorderRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const touringId = c.req.param('touringId')
    const body = c.req.valid('json')

    const spotRepo = new PrismaSpotRepository(prisma)
    const touringRepo = new PrismaTouringRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new SpotService(spotRepo, touringRepo, myUserBikeRepo)

    await service.reorderSpots(
      body.spotIds,
      createTouringId(touringId),
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        data: undefined,
        message: 'スポット並び替え成功',
      },
      200
    )
  }
)

// スポット更新
userBike.patch(
  '/bike/:myUserBikeId/tourings/:touringId/spots/:spotId',
  honoAuthMiddleware,
  zodValidateJson(SpotUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const touringId = c.req.param('touringId')
    const spotId = c.req.param('spotId')
    const body = c.req.valid('json')

    const spotRepo = new PrismaSpotRepository(prisma)
    const touringRepo = new PrismaTouringRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new SpotService(spotRepo, touringRepo, myUserBikeRepo)

    const spot = await service.updateSpot({
      spotId: createSpotId(spotId),
      touringId: createTouringId(touringId),
      myUserBikeId: createMyUserBikeId(myUserBikeId),
      userId: createUserId(userId),
      name: body.name,
      memo: body.memo,
      latitude: body.latitude,
      longitude: body.longitude,
      visitedAt: body.visitedAt,
      endAt: body.endAt,
    })

    return c.json<SuccessResponse<ApiResponseSpotDetail>>(
      {
        status: 'success',
        data: {
          spotId: spot.id,
          touringId: spot.touringId,
          type: spot.type,
          name: spot.name,
          memo: spot.memo,
          latitude: spot.latitude,
          longitude: spot.longitude,
          visitedAt: spot.visitedAt.toISOString(),
          endAt: spot.endAt?.toISOString() ?? null,
          sortOrder: spot.sortOrder,
        },
        message: 'スポット更新成功',
      },
      200
    )
  }
)

// スポット削除
userBike.delete(
  '/bike/:myUserBikeId/tourings/:touringId/spots/:spotId',
  honoAuthMiddleware,
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const touringId = c.req.param('touringId')
    const spotId = c.req.param('spotId')

    const spotRepo = new PrismaSpotRepository(prisma)
    const touringRepo = new PrismaTouringRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new SpotService(spotRepo, touringRepo, myUserBikeRepo)

    await service.deleteSpot(
      createSpotId(spotId),
      createTouringId(touringId),
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        data: undefined,
        message: 'スポット削除成功',
      },
      200
    )
  }
)


}
