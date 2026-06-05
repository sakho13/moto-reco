import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseSpotDetail,
  ApiResponseSpotList,
  ApiResponseTouringDetail,
  ApiResponseTouringList,
  createFuelLogId,
  createMyUserBikeId,
  createSpotId,
  createTouringId,
  createUserId,
  SpotRegisterRequestSchema,
  SpotReorderRequestSchema,
  SpotUpdateRequestSchema,
  SuccessResponse,
  TouringDeleteRequestSchema,
  TouringListQuerySchema,
  TouringRegisterRequestSchema,
  TouringStartEndRequestSchema,
  TouringUpdateRequestSchema,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../../middlewares/honoAuth'
import {
  zodValidateJson,
  zodValidateQuery,
} from '../../middlewares/zodValidation'
import { PrismaFuelLogRepository } from '../../repositories/PrismaFuelLogRepository'
import { PrismaHistoryRepository } from '../../repositories/PrismaHistoryRepository'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { PrismaSpotRepository } from '../../repositories/PrismaSpotRepository'
import { PrismaTouringRepository } from '../../repositories/PrismaTouringRepository'
import { SpotService } from '../../services/SpotService'
import { TouringService } from '../../services/TouringService'
import { TouringSearchParams } from '../../valueObjects/TouringSearchParams'

const userBikeTourings = new Hono().basePath('/bike/:myUserBikeId/tourings')

userBikeTourings.get(
  '/',
  honoAuthMiddleware,
  zodValidateQuery(TouringListQuerySchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const searchParams = new TouringSearchParams({
      sortBy: query['sort-by'] === 'end-date' ? 'endDate' : 'startDate',
      sortOrder: query['sort-order'],
      status: query['status'],
    })

    const touringRepo = new PrismaTouringRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const fuelLogRepo = new PrismaFuelLogRepository(prisma)
    const service = new TouringService(touringRepo, myUserBikeRepo, fuelLogRepo)

    const tourings = await service.getTourings(
      createMyUserBikeId(myUserBikeId),
      createUserId(userId),
      searchParams
    )

    return c.json<SuccessResponse<ApiResponseTouringList>>(
      {
        status: 'success',
        data: tourings.map((touring) => {
          return {
            touringId: touring.id,
            title: touring.title,
            startDate: touring.startDate.toISOString(),
            endDate: touring.endDate.toISOString(),
            startMileage: touring.startMileage,
            endMileage: touring.endMileage,
            startLatitude: touring.startLatitude,
            startLongitude: touring.startLongitude,
            endLatitude: touring.endLatitude,
            endLongitude: touring.endLongitude,
            status: touring.status,
            fuelLogIds: [], // 一覧では空配列（詳細APIで取得する）
          }
        }),
        message: 'ツーリング一覧取得成功',
      },
      200
    )
  }
)

userBikeTourings.post(
  '/',
  honoAuthMiddleware,
  zodValidateJson(TouringRegisterRequestSchema),
  async (c) => {
    const { userId, role } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringRepo = new PrismaTouringRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const service = new TouringService(
        touringRepo,
        myUserBikeRepo,
        fuelLogRepo
      )

      const touring = await service.registerTouring({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        role,
        title: body.title,
        startDate: body.startDate,
        endDate: body.endDate,
        startMileage: body.startMileage,
        endMileage: body.endMileage,
        status: body.status,
      })

      // PLANNEDのときはまだツーリングが完了していないので履歴を作成しない
      if (touring.status !== 'PLANNED') {
        const historyRepo = new PrismaHistoryRepository(t)
        await historyRepo.createHistory({
          userId: createUserId(userId),
          userMyBikeId: createMyUserBikeId(myUserBikeId),
          type: 'TOURING',
          occurredAt: touring.endDate,
          touringId: touring.id,
        })
      }

      return touring
    })

    return c.json<SuccessResponse<ApiResponseTouringDetail>>(
      {
        status: 'success',
        data: {
          touringId: result.id,
          title: result.title,
          startDate: result.startDate.toISOString(),
          endDate: result.endDate.toISOString(),
          startMileage: result.startMileage,
          endMileage: result.endMileage,
          startLatitude: result.startLatitude,
          startLongitude: result.startLongitude,
          endLatitude: result.endLatitude,
          endLongitude: result.endLongitude,
          status: result.status,
          fuelLogIds: [], // 登録時は給油履歴は紐づいていない
        },
        message: 'ツーリング登録成功',
      },
      201
    )
  }
)

userBikeTourings.delete(
  '/',
  honoAuthMiddleware,
  zodValidateJson(TouringDeleteRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    await prisma.$transaction((t) => {
      const touringRepo = new PrismaTouringRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const service = new TouringService(
        touringRepo,
        myUserBikeRepo,
        fuelLogRepo
      )

      return service.deleteTouring({
        touringId: createTouringId(body.touringId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
      })
    })

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        message: 'ツーリング削除成功',
        data: undefined,
      },
      200
    )
  }
)

userBikeTourings.post(
  '/start-end',
  honoAuthMiddleware,
  zodValidateJson(TouringStartEndRequestSchema),
  async (c) => {
    const { userId, role } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringRepo = new PrismaTouringRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const service = new TouringService(
        touringRepo,
        myUserBikeRepo,
        fuelLogRepo
      )

      if (body.action === 'start') {
        return service.handleTouringAction({
          action: 'start',
          myUserBikeId: createMyUserBikeId(myUserBikeId),
          userId: createUserId(userId),
          role,
          touringPlanId: body.touringPlanId,
          title: body.title,
          startDate: body.startDate,
          startMileage: body.startMileage,
          startLatitude: body.startLatitude,
          startLongitude: body.startLongitude,
        })
      }

      const touring = await service.handleTouringAction({
        action: 'end',
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        touringId: body.touringId,
        endDate: body.endDate,
        endMileage: body.endMileage,
        endLatitude: body.endLatitude,
        endLongitude: body.endLongitude,
      })

      const historyRepo = new PrismaHistoryRepository(t)
      await historyRepo.createHistory({
        userId: createUserId(userId),
        userMyBikeId: createMyUserBikeId(myUserBikeId),
        type: 'TOURING',
        occurredAt: touring.endDate,
        touringId: touring.id,
      })

      return touring
    })

    const status = body.action === 'start' ? 201 : 200
    const message =
      body.action === 'start' ? 'ツーリング開始成功' : 'ツーリング終了成功'

    // 紐づいている給油履歴IDを取得
    const fuelLogRecordsForStartEnd = await prisma.tUserMyBikeFuelLog.findMany({
      where: {
        touringId: result.id,
        userMyBikeId: myUserBikeId,
      },
      select: {
        id: true,
      },
    })
    const fuelLogIdsForStartEnd = fuelLogRecordsForStartEnd.map(
      (record: { id: string }) => record.id
    )

    return c.json<SuccessResponse<ApiResponseTouringDetail>>(
      {
        status: 'success',
        data: {
          touringId: result.id,
          title: result.title,
          startDate: result.startDate.toISOString(),
          endDate: result.endDate.toISOString(),
          startMileage: result.startMileage,
          endMileage: result.endMileage,
          startLatitude: result.startLatitude,
          startLongitude: result.startLongitude,
          endLatitude: result.endLatitude,
          endLongitude: result.endLongitude,
          status: result.status,
          fuelLogIds: fuelLogIdsForStartEnd,
        },
        message,
      },
      status
    )
  }
)

userBikeTourings.get('/:touringId', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const myUserBikeId = c.req.param('myUserBikeId')
  const touringId = c.req.param('touringId')

  const touringRepo = new PrismaTouringRepository(prisma)
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const fuelLogRepo = new PrismaFuelLogRepository(prisma)
  const service = new TouringService(touringRepo, myUserBikeRepo, fuelLogRepo)

  const touring = await service.getTouringById(
    createTouringId(touringId),
    createMyUserBikeId(myUserBikeId),
    createUserId(userId)
  )

  // 紐づいている給油履歴IDを取得
  const fuelLogRecords = await prisma.tUserMyBikeFuelLog.findMany({
    where: {
      touringId: touringId,
      userMyBikeId: myUserBikeId,
    },
    select: {
      id: true,
    },
  })
  const fuelLogIds = fuelLogRecords.map((record) => record.id)

  return c.json<SuccessResponse<ApiResponseTouringDetail>>(
    {
      status: 'success',
      data: {
        touringId: touring.id,
        title: touring.title,
        startDate: touring.startDate.toISOString(),
        endDate: touring.endDate.toISOString(),
        startMileage: touring.startMileage,
        endMileage: touring.endMileage,
        startLatitude: touring.startLatitude,
        startLongitude: touring.startLongitude,
        endLatitude: touring.endLatitude,
        endLongitude: touring.endLongitude,
        status: touring.status,
        fuelLogIds: fuelLogIds,
      },
      message: 'ツーリング取得成功',
    },
    200
  )
})

userBikeTourings.patch(
  '/:touringId',
  honoAuthMiddleware,
  zodValidateJson(TouringUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const touringId = c.req.param('touringId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringRepo = new PrismaTouringRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const fuelLogRepo = new PrismaFuelLogRepository(t)
      const historyRepo = new PrismaHistoryRepository(t)
      const service = new TouringService(
        touringRepo,
        myUserBikeRepo,
        fuelLogRepo
      )

      const updated = await service.updateTouring({
        touringId: createTouringId(touringId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        title: body.title,
        startDate: body.startDate,
        endDate: body.endDate,
        startMileage: body.startMileage,
        endMileage: body.endMileage,
        status: body.status,
        fuelLogIds: body.fuelLogIds?.map(createFuelLogId),
        startLatitude: body.startLatitude,
        startLongitude: body.startLongitude,
        endLatitude: body.endLatitude,
        endLongitude: body.endLongitude,
      })

      // ツーリング終了日が変更された場合、ヒストリーの occurredAt を更新
      if (body.endDate !== undefined) {
        await historyRepo.updateOccurredAtByTouringId(
          createTouringId(touringId),
          updated.endDate
        )
      }

      return updated
    })

    // 更新後の紐づいている給油履歴IDを取得
    const fuelLogRecords = await prisma.tUserMyBikeFuelLog.findMany({
      where: {
        touringId: touringId,
        userMyBikeId: myUserBikeId,
      },
      select: {
        id: true,
      },
    })
    const fuelLogIds = fuelLogRecords.map((record) => record.id)

    return c.json<SuccessResponse<ApiResponseTouringDetail>>(
      {
        status: 'success',
        data: {
          touringId: result.id,
          title: result.title,
          startDate: result.startDate.toISOString(),
          endDate: result.endDate.toISOString(),
          startMileage: result.startMileage,
          endMileage: result.endMileage,
          startLatitude: result.startLatitude,
          startLongitude: result.startLongitude,
          endLatitude: result.endLatitude,
          endLongitude: result.endLongitude,
          status: result.status,
          fuelLogIds: fuelLogIds,
        },
        message: 'ツーリング更新成功',
      },
      200
    )
  }
)

// スポット一覧取得
userBikeTourings.get('/:touringId/spots', honoAuthMiddleware, async (c) => {
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
})

// スポット登録
userBikeTourings.post(
  '/:touringId/spots',
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

// スポット並び替え（/:spotId より前に定義）
userBikeTourings.patch(
  '/:touringId/spots/reorder',
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
userBikeTourings.patch(
  '/:touringId/spots/:spotId',
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
userBikeTourings.delete(
  '/:touringId/spots/:spotId',
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

export default userBikeTourings
