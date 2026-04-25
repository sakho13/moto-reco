import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseUserBikeList,
  ApiResponseUserBikeDetail,
  ApiResponseFuelLogDetail,
  ApiResponseFuelLogList,
  ApiResponseFuelInsight,
  ApiResponseMaintenanceLogDetail,
  ApiResponseMaintenanceLogList,
  ApiResponseBikeHistoryList,
  ApiResponseAllBikesHistoryList,
  ApiResponseTouringDetail,
  ApiResponseTouringList,
  ApiResponseBikesOngoingTourings,
  ApiResponseSpotDetail,
  ApiResponseSpotList,
  ApiResponsePostDetail,
  ApiResponsePostList,
  createBikeId,
  createFuelLogId,
  createMaintenanceLogId,
  createMyUserBikeId,
  createPostId,
  createSpotId,
  createTouringId,
  createUserId,
  FuelInsightPeriod,
  MaintenanceLogListQuerySchema,
  MaintenanceLogRegisterRequestSchema,
  MaintenanceLogUpdateRequestSchema,
  SuccessResponse,
  UserBikeRegisterRequestSchema,
  UserBikeUpdateRequestSchema,
  UserBikeListQuerySchema,
  FuelInsightQuerySchema,
  FuelLogRegisterRequestSchema,
  FuelLogUpdateRequestSchema,
  FuelLogDeleteRequestSchema,
  FuelLogListQuerySchema,
  FuelLogDetailParamSchema,
  TouringRegisterRequestSchema,
  TouringStartEndRequestSchema,
  TouringListQuerySchema,
  TouringUpdateRequestSchema,
  TouringDeleteRequestSchema,
  SpotRegisterRequestSchema,
  SpotUpdateRequestSchema,
  SpotReorderRequestSchema,
  HistoryListQuerySchema,
  PostRegisterRequestSchema,
  PostListQuerySchema,
} from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import { MyUserBikeDetail } from '../interfaces/IMyUserBikeRepository'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import {
  zodValidateJson,
  zodValidateParam,
  zodValidateQuery,
} from '../middlewares/zodValidation'
import { PrismaBikeRepository } from '../repositories/PrismaBikeRepository'
import { PrismaFuelInsightRepository } from '../repositories/PrismaFuelInsightRepository'
import { PrismaFuelLogRepository } from '../repositories/PrismaFuelLogRepository'
import { PrismaHistoryRepository } from '../repositories/PrismaHistoryRepository'
import { PrismaMaintenanceLogRepository } from '../repositories/PrismaMaintenanceLogRepository'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaPostRepository } from '../repositories/PrismaPostRepository'
import { PrismaSpotRepository } from '../repositories/PrismaSpotRepository'
import { PrismaTouringRepository } from '../repositories/PrismaTouringRepository'
import { PrismaUserBikeRepository } from '../repositories/PrismaUserBikeRepository'
import { FuelInsightService } from '../services/FuelInsightService'
import { FuelLogService } from '../services/FuelLogService'
import { MaintenanceLogService } from '../services/MaintenanceLogService'
import { PostService } from '../services/PostService'
import { SpotService } from '../services/SpotService'
import { TouringService } from '../services/TouringService'
import { UserBikeService } from '../services/UserBikeService'
import { FuelInsightSearchParams } from '../valueObjects/FuelInsightSearchParams'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'
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
  isPublic: detail.isPublic,
  createdAt: detail.createdAt.toISOString(),
  updatedAt: detail.updatedAt.toISOString(),
  fuelLogCount: detail.fuelLogCount,
  touringCount: detail.touringCount,
})

userBike.post(
  '/register',
  honoAuthMiddleware,
  zodValidateJson(UserBikeRegisterRequestSchema),
  async (c) => {
    const { userId, role } = c.var.user!
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
        role,
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
        totalMileage: body.totalMileage,
        isPublic: body.isPublic,
      })

      return service.getMyUserBikeDetail(
        myUserBike.myUserBikeId,
        createUserId(userId)
      )
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

userBike.get('/bikes/ongoing-tourings', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  // ユーザーの全バイクを取得
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const bikes = await myUserBikeRepo.findMyUserBikes(
    createUserId(userId),
    new UserBikeSearchParams({ sortBy: 'updatedAt', sortOrder: 'desc' })
  )

  // リポジトリとサービスをインスタンス化（読み取り専用なのでトランザクション不要）
  const touringRepo = new PrismaTouringRepository(prisma)
  const fuelLogRepo = new PrismaFuelLogRepository(prisma)
  const myUserBikeRepoForService = new PrismaMyUserBikeRepository(prisma)
  const touringService = new TouringService(
    touringRepo,
    myUserBikeRepoForService,
    fuelLogRepo
  )

  // 各バイクの進行中ツーリングを取得（並列処理）
  const bikesWithOngoingTouring = await Promise.all(
    bikes.map(async (bike) => {
      // サービス経由で進行中ツーリングを取得
      const tourings = await touringService.getTourings(
        bike.myUserBikeId,
        createUserId(userId),
        new TouringSearchParams({ sortBy: 'startDate', sortOrder: 'desc' })
      )

      // 進行中のツーリングを見つける
      const ongoingTouring = tourings.find((t) => t.status === 'STARTED')

      if (!ongoingTouring) {
        return {
          myUserBikeId: bike.myUserBikeId,
          ongoingTouring: null,
        }
      }

      // 給油履歴IDを取得（リポジトリ経由）
      const fuelLogs = await fuelLogRepo.findFuelLogs(
        bike.myUserBikeId,
        new FuelLogSearchParams({
          startDate: ongoingTouring.startDate,
          endDate: ongoingTouring.endDate,
        })
      )
      const fuelLogIds = fuelLogs
        .filter((log) => log.touringId === ongoingTouring.id)
        .map((log) => log.id)

      return {
        myUserBikeId: bike.myUserBikeId,
        ongoingTouring: {
          touringId: ongoingTouring.id,
          title: ongoingTouring.title,
          startDate: ongoingTouring.startDate.toISOString(),
          endDate: ongoingTouring.endDate.toISOString(),
          startMileage: ongoingTouring.startMileage,
          endMileage: ongoingTouring.endMileage,
          startLatitude: ongoingTouring.startLatitude,
          startLongitude: ongoingTouring.startLongitude,
          endLatitude: ongoingTouring.endLatitude,
          endLongitude: ongoingTouring.endLongitude,
          status: ongoingTouring.status,
          fuelLogIds,
        },
      }
    })
  )

  return c.json<SuccessResponse<ApiResponseBikesOngoingTourings>>({
    status: 'success',
    data: {
      bikes: bikesWithOngoingTouring,
    },
    message: '進行中ツーリング一覧取得成功',
  })
})

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
    const { userId, role } = c.var.user!
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
        role,
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
        displacement: body.displacement,
        totalMileage: body.totalMileage,
        isPublic: body.isPublic,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserBikeDetail>>({
      status: 'success',
      data: toApiResponseUserBikeDetail(detail),
      message: 'ユーザー所有バイク情報更新成功',
    })
  }
)

userBike.get('/history', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  const queryResult = HistoryListQuerySchema.safeParse(c.req.query())
  if (!queryResult.success) {
    return c.json(
      {
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'クエリパラメータが不正です',
      },
      400
    )
  }
  const page = queryResult.data.page ?? 1
  const pageSize = queryResult.data['per-size'] ?? 20
  const skip = (page - 1) * pageSize
  const take = pageSize

  const histories = await prisma.tUserMyBikeHistory.findMany({
    where: { userId },
    include: {
      userMyBike: {
        include: {
          userBike: {
            include: {
              bike: {
                include: {
                  manufacturer: { select: { name: true } },
                },
              },
            },
          },
        },
      },
      fuelLog: {
        include: {
          touring: {
            select: { id: true, title: true },
          },
        },
      },
      touring: true,
      post: {
        include: {
          photos: { orderBy: { orderIndex: 'asc' } },
        },
      },
    },
    orderBy: { occurredAt: 'desc' },
    skip,
    take,
  })

  const historyItems: ApiResponseAllBikesHistoryList = histories.flatMap(
    (h): ApiResponseAllBikesHistoryList => {
      const bikeId = h.userMyBikeId ?? ''
      const myBike = h.userMyBike
      const bikeName = myBike
        ? (myBike.nickname ??
          (`${myBike.userBike.bike?.manufacturer?.name ?? ''} ${myBike.userBike.bike?.modelName ?? ''}`.trim() ||
            '不明なバイク'))
        : '不明なバイク'

      if (h.type === 'FUEL_LOG' && h.fuelLog) {
        const log = h.fuelLog
        const distance = log.mileage - log.previousMileage
        const fuelEfficiency = distance > 0 ? distance / log.amount : null
        const pricePerLiter = log.amount > 0 ? log.price / log.amount : null

        return [
          {
            type: 'FUEL_LOG' as const,
            occurredAt: h.occurredAt.toISOString(),
            bikeId,
            bikeName,
            fuelLog: {
              fuelLogId: log.id,
              refueledAt: log.refueledAt.toISOString(),
              mileage: log.mileage,
              previousMileage: log.previousMileage,
              amount: log.amount,
              totalPrice: log.price,
              memo: log.memo,
              fuelEfficiency,
              pricePerLiter,
              touringId: log.touringId,
              touringTitle: log.touring?.title ?? null,
            },
          },
        ]
      }

      if (h.type === 'TOURING' && h.touring) {
        const touring = h.touring
        return [
          {
            type: 'TOURING' as const,
            occurredAt: h.occurredAt.toISOString(),
            bikeId,
            bikeName,
            touring: {
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
              fuelLogIds: [],
            },
          },
        ]
      }

      if (h.type === 'POST' && h.post) {
        const post = h.post
        return [
          {
            type: 'POST' as const,
            occurredAt: h.occurredAt.toISOString(),
            bikeId,
            bikeName,
            post: {
              postId: post.id,
              title: post.title,
              description: post.description,
              occurredAt: post.occurredAt.toISOString(),
              photos: post.photos.map((p) => ({
                postPhotoId: p.id,
                photoUrl: p.photoUrl,
                orderIndex: p.orderIndex,
              })),
            },
          },
        ]
      }

      return []
    }
  )

  return c.json<SuccessResponse<ApiResponseAllBikesHistoryList>>({
    status: 'success',
    data: historyItems,
    message: '全バイクヒストリー一覧取得成功',
  })
})

userBike.get('/bike/:myUserBikeId/history', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const myUserBikeId = c.req.param('myUserBikeId')

  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const myUserBike = await myUserBikeRepo.findMyUserBikeById(
    createMyUserBikeId(myUserBikeId),
    createUserId(userId)
  )

  if (!myUserBike) {
    throw new ApiV1Error('NOT_FOUND', 'バイクが見つかりません')
  }

  const histories = await prisma.tUserMyBikeHistory.findMany({
    where: { userMyBikeId: myUserBikeId },
    include: {
      fuelLog: {
        include: {
          touring: {
            select: { id: true, title: true },
          },
        },
      },
      touring: true,
      post: {
        include: {
          photos: { orderBy: { orderIndex: 'asc' } },
        },
      },
    },
    orderBy: { occurredAt: 'desc' },
  })

  const historyItems: ApiResponseBikeHistoryList = histories.flatMap(
    (h): ApiResponseBikeHistoryList => {
      if (h.type === 'FUEL_LOG' && h.fuelLog) {
        const log = h.fuelLog
        const distance = log.mileage - log.previousMileage
        const fuelEfficiency = distance > 0 ? distance / log.amount : null
        const pricePerLiter = log.amount > 0 ? log.price / log.amount : null

        return [
          {
            type: 'FUEL_LOG' as const,
            occurredAt: h.occurredAt.toISOString(),
            fuelLog: {
              fuelLogId: log.id,
              refueledAt: log.refueledAt.toISOString(),
              mileage: log.mileage,
              previousMileage: log.previousMileage,
              amount: log.amount,
              totalPrice: log.price,
              memo: log.memo,
              fuelEfficiency,
              pricePerLiter,
              touringId: log.touringId,
              touringTitle: log.touring?.title ?? null,
            },
          },
        ]
      }

      if (h.type === 'TOURING' && h.touring) {
        const touring = h.touring
        return [
          {
            type: 'TOURING' as const,
            occurredAt: h.occurredAt.toISOString(),
            touring: {
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
              fuelLogIds: [],
            },
          },
        ]
      }

      if (h.type === 'POST' && h.post) {
        const post = h.post
        return [
          {
            type: 'POST' as const,
            occurredAt: h.occurredAt.toISOString(),
            post: {
              postId: post.id,
              title: post.title,
              description: post.description,
              occurredAt: post.occurredAt.toISOString(),
              photos: post.photos.map((p) => ({
                postPhotoId: p.id,
                photoUrl: p.photoUrl,
                orderIndex: p.orderIndex,
              })),
            },
          },
        ]
      }

      return []
    }
  )

  return c.json<SuccessResponse<ApiResponseBikeHistoryList>>({
    status: 'success',
    data: historyItems,
    message: 'バイクヒストリー一覧取得成功',
  })
})

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

userBike.get(
  '/bike/:myUserBikeId/fuel-logs/:fuelLogId',
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

userBike.post(
  '/bike/:myUserBikeId/fuel-logs',
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

userBike.patch(
  '/bike/:myUserBikeId/fuel-logs',
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

userBike.delete(
  '/bike/:myUserBikeId/fuel-logs',
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

userBike.delete(
  '/bike/:myUserBikeId/tourings',
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

userBike.get(
  '/bike/:myUserBikeId/maintenance-logs',
  honoAuthMiddleware,
  zodValidateQuery(MaintenanceLogListQuerySchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const maintenanceLogRepo = new PrismaMaintenanceLogRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new MaintenanceLogService(
      maintenanceLogRepo,
      myUserBikeRepo
    )

    const logs = await service.getMaintenanceLogs({
      myUserBikeId: createMyUserBikeId(myUserBikeId),
      userId: createUserId(userId),
      page: query.page ?? 1,
      perSize: query['per-size'] ?? 20,
      sortOrder: query['sort-order'] ?? 'desc',
    })

    return c.json<SuccessResponse<ApiResponseMaintenanceLogList>>(
      {
        status: 'success',
        data: logs.map((log) => ({
          maintenanceLogId: log.id,
          performedAt: log.performedAt.toISOString(),
          mileage: log.mileage,
          memo: log.memo,
          items: log.items,
        })),
        message: 'メンテナンス履歴一覧取得成功',
      },
      200
    )
  }
)

userBike.post(
  '/bike/:myUserBikeId/maintenance-logs',
  honoAuthMiddleware,
  zodValidateJson(MaintenanceLogRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction((t) => {
      const maintenanceLogRepo = new PrismaMaintenanceLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new MaintenanceLogService(
        maintenanceLogRepo,
        myUserBikeRepo
      )

      return service.registerMaintenanceLog({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        performedAt: body.performedAt,
        mileage: body.mileage,
        memo: body.memo,
        items: body.items,
        updateTotalMileage: body.updateTotalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseMaintenanceLogDetail>>(
      {
        status: 'success',
        data: {
          maintenanceLogId: result.id,
          performedAt: result.performedAt.toISOString(),
          mileage: result.mileage,
          memo: result.memo,
          items: result.items,
        },
        message: 'メンテナンス履歴登録成功',
      },
      201
    )
  }
)

userBike.patch(
  '/bike/:myUserBikeId/maintenance-logs',
  honoAuthMiddleware,
  zodValidateJson(MaintenanceLogUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction((t) => {
      const maintenanceLogRepo = new PrismaMaintenanceLogRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new MaintenanceLogService(
        maintenanceLogRepo,
        myUserBikeRepo
      )

      return service.updateMaintenanceLog({
        maintenanceLogId: createMaintenanceLogId(body.maintenanceLogId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        performedAt: body.performedAt,
        mileage: body.mileage,
        memo: body.memo,
        items: body.items,
        updateTotalMileage: body.updateTotalMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseMaintenanceLogDetail>>(
      {
        status: 'success',
        data: {
          maintenanceLogId: result.id,
          performedAt: result.performedAt.toISOString(),
          mileage: result.mileage,
          memo: result.memo,
          items: result.items,
        },
        message: 'メンテナンス履歴更新成功',
      },
      200
    )
  }
)

userBike.get(
  '/bike/:myUserBikeId/fuel-insights',
  honoAuthMiddleware,
  zodValidateQuery(FuelInsightQuerySchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const searchParams = new FuelInsightSearchParams({
      period: query.period as FuelInsightPeriod | undefined,
    })

    const fuelInsightRepo = new PrismaFuelInsightRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const fuelInsightService = new FuelInsightService(
      fuelInsightRepo,
      myUserBikeRepo
    )

    const insight = await fuelInsightService.getFuelInsight(
      createMyUserBikeId(myUserBikeId),
      createUserId(userId),
      searchParams.period
    )

    return c.json<SuccessResponse<ApiResponseFuelInsight>>({
      status: 'success',
      data: {
        averageFuelEfficiency: insight.averageFuelEfficiency,
        averageAmount: insight.averageAmount,
        averageTotalPrice: insight.averageTotalPrice,
        averagePricePerLiter: insight.averagePricePerLiter,
        minPricePerLiter: insight.minPricePerLiter,
        maxPricePerLiter: insight.maxPricePerLiter,
      },
      message: '燃費インサイト取得成功',
    })
  }
)

userBike.post(
  '/bike/:myUserBikeId/tourings/start-end',
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

userBike.post(
  '/bike/:myUserBikeId/tourings',
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

userBike.get(
  '/bike/:myUserBikeId/tourings',
  honoAuthMiddleware,
  zodValidateQuery(TouringListQuerySchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const searchParams = new TouringSearchParams({
      sortBy: query['sort-by'] === 'end-date' ? 'endDate' : 'startDate',
      sortOrder: query['sort-order'],
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

userBike.get(
  '/bike/:myUserBikeId/tourings/:touringId',
  honoAuthMiddleware,
  async (c) => {
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
  }
)

userBike.patch(
  '/bike/:myUserBikeId/tourings/:touringId',
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

const toApiResponsePostDetail = (post: {
  id: string
  title: string | null
  description: string | null
  occurredAt: Date
  photos: { id: string; photoUrl: string; orderIndex: number }[]
}): ApiResponsePostDetail => ({
  postId: post.id,
  title: post.title,
  description: post.description,
  occurredAt: post.occurredAt.toISOString(),
  photos: post.photos.map((p) => ({
    postPhotoId: p.id,
    photoUrl: p.photoUrl,
    orderIndex: p.orderIndex,
  })),
})

// 投稿登録
userBike.post(
  '/bike/:myUserBikeId/posts',
  honoAuthMiddleware,
  zodValidateJson(PostRegisterRequestSchema),
  async (c) => {
    const { userId, role } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const post = await prisma.$transaction(async (t) => {
      const postRepo = new PrismaPostRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new PostService(postRepo, myUserBikeRepo)

      const created = await service.registerPost({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        role,
        title: body.title,
        description: body.description,
        occurredAt: body.occurredAt,
        photoUrls: body.photoUrls,
      })

      const historyRepo = new PrismaHistoryRepository(t)
      await historyRepo.createHistory({
        userId: createUserId(userId),
        userMyBikeId: createMyUserBikeId(myUserBikeId),
        type: 'POST',
        occurredAt: created.occurredAt,
        postId: createPostId(created.id),
      })

      return created
    })

    return c.json<SuccessResponse<ApiResponsePostDetail>>(
      {
        status: 'success',
        data: toApiResponsePostDetail({
          id: post.id,
          title: post.title,
          description: post.description,
          occurredAt: post.occurredAt,
          photos: post.photos.map((p) => ({
            id: p.postPhotoId,
            photoUrl: p.photoUrl,
            orderIndex: p.orderIndex,
          })),
        }),
        message: '投稿登録成功',
      },
      201
    )
  }
)

// 投稿一覧取得
userBike.get(
  '/bike/:myUserBikeId/posts',
  honoAuthMiddleware,
  zodValidateQuery(PostListQuerySchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const query = c.req.valid('query')

    const page = query.page ?? 1
    const pageSize = query['per-size'] ?? 20

    const postRepo = new PrismaPostRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new PostService(postRepo, myUserBikeRepo)

    const posts = await service.getPosts(
      createMyUserBikeId(myUserBikeId),
      createUserId(userId),
      { page, pageSize }
    )

    return c.json<SuccessResponse<ApiResponsePostList>>({
      status: 'success',
      data: posts.map((post) =>
        toApiResponsePostDetail({
          id: post.id,
          title: post.title,
          description: post.description,
          occurredAt: post.occurredAt,
          photos: post.photos.map((p) => ({
            id: p.postPhotoId,
            photoUrl: p.photoUrl,
            orderIndex: p.orderIndex,
          })),
        })
      ),
      message: '投稿一覧取得成功',
    })
  }
)

// 投稿詳細取得
userBike.get(
  '/bike/:myUserBikeId/posts/:postId',
  honoAuthMiddleware,
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const postId = c.req.param('postId')

    const postRepo = new PrismaPostRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new PostService(postRepo, myUserBikeRepo)

    const post = await service.getPostById(
      createPostId(postId),
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )

    return c.json<SuccessResponse<ApiResponsePostDetail>>({
      status: 'success',
      data: toApiResponsePostDetail({
        id: post.id,
        title: post.title,
        description: post.description,
        occurredAt: post.occurredAt,
        photos: post.photos.map((p) => ({
          id: p.postPhotoId,
          photoUrl: p.photoUrl,
          orderIndex: p.orderIndex,
        })),
      }),
      message: '投稿詳細取得成功',
    })
  }
)

// 投稿削除
userBike.delete(
  '/bike/:myUserBikeId/posts/:postId',
  honoAuthMiddleware,
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const postId = c.req.param('postId')

    await prisma.$transaction((t) => {
      const postRepo = new PrismaPostRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new PostService(postRepo, myUserBikeRepo)

      return service.deletePost({
        postId: createPostId(postId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
      })
    })

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        data: undefined,
        message: '投稿削除成功',
      },
      200
    )
  }
)

export default userBike
