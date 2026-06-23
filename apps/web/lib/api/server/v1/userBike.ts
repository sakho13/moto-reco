import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseUserBikeList,
  ApiResponseUserBikeDetail,
  ApiResponseFuelInsight,
  ApiResponseBikeHistoryList,
  ApiResponseAllBikesHistoryList,
  ApiResponseBikesOngoingTourings,
  createBikeId,
  createMyUserBikeId,
  FuelInsightPeriod,
  SuccessResponse,
  UserBikeRegisterRequestSchema,
  UserBikeUpdateRequestSchema,
  UserBikeListQuerySchema,
  FuelInsightQuerySchema,
  HistoryListQuerySchema,
} from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import { MyUserBikeDetail } from '../interfaces/IMyUserBikeRepository'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson, zodValidateQuery } from '../middlewares/zodValidation'
import { PrismaBikeRepository } from '../repositories/PrismaBikeRepository'
import { PrismaFuelInsightRepository } from '../repositories/PrismaFuelInsightRepository'
import { PrismaFuelLogRepository } from '../repositories/PrismaFuelLogRepository'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaTouringRepository } from '../repositories/PrismaTouringRepository'
import { PrismaUserBikeRepository } from '../repositories/PrismaUserBikeRepository'
import { FuelInsightService } from '../services/FuelInsightService'
import { TouringService } from '../services/TouringService'
import { UserBikeService } from '../services/UserBikeService'
import { FuelInsightSearchParams } from '../valueObjects/FuelInsightSearchParams'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'
import { UserBikeSearchParams } from '../valueObjects/UserBikeSearchParams'
import userBikeFuelLogs from './userBike/fuelLogs'
import userBikeMaintenanceLogs from './userBike/maintenanceLogs'
import userBikeTouringPlans from './userBike/touringPlans'
import userBikeTourings from './userBike/tourings'

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
  fuelLogCount: detail.fuelLogCount,
  touringCount: detail.touringCount,
})

userBike.post(
  '/register',
  honoAuthMiddleware,
  zodValidateJson(UserBikeRegisterRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
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
        user: userEntity,
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
        totalMileage: body.totalMileage,
      })

      return service.getMyUserBikeDetail(myUserBike.myUserBikeId, userEntity.id)
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
    const { userEntity } = c.var.user!
    const query = c.req.valid('query')

    const searchParams = new UserBikeSearchParams({
      sortBy: query['sort-by'] === 'created-at' ? 'createdAt' : 'updatedAt',
      sortOrder: query['sort-order'],
    })

    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const bikes = await myUserBikeRepo.findMyUserBikes(
      userEntity.id,
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
  const { userEntity } = c.var.user!

  // ユーザーの全バイクを取得
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const bikes = await myUserBikeRepo.findMyUserBikes(
    userEntity.id,
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
        userEntity.id,
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
          touringPlanId: ongoingTouring.touringPlanId,
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
  const { userEntity } = c.var.user!

  const detail = await prisma.$transaction((t) => {
    const userBikeRepo = new PrismaUserBikeRepository(t)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
    const bikeRepo = new PrismaBikeRepository(t)
    const service = new UserBikeService(userBikeRepo, myUserBikeRepo, bikeRepo)

    return service.getMyUserBikeDetail(
      c.req.param('myUserBikeId'),
      userEntity.id
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
    const { userEntity } = c.var.user!
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
        userId: userEntity.id,
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
        displacement: body.displacement,
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

userBike.get('/history', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!

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
    where: { userId: String(userEntity.id) },
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
              touringPlanId: touring.planId,
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
  const { userEntity } = c.var.user!
  const myUserBikeId = c.req.param('myUserBikeId')

  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const myUserBike = await myUserBikeRepo.findMyUserBikeById(
    createMyUserBikeId(myUserBikeId),
    userEntity.id
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
              touringPlanId: touring.planId,
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

      return []
    }
  )

  return c.json<SuccessResponse<ApiResponseBikeHistoryList>>({
    status: 'success',
    data: historyItems,
    message: 'バイクヒストリー一覧取得成功',
  })
})

userBike.route('/', userBikeFuelLogs)

userBike.get(
  '/bike/:myUserBikeId/fuel-insights',
  honoAuthMiddleware,
  zodValidateQuery(FuelInsightQuerySchema),
  async (c) => {
    const { userEntity } = c.var.user!
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
      userEntity.id,
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

userBike.route('/', userBikeMaintenanceLogs)

userBike.route('/', userBikeTourings)

userBike.route('/', userBikeTouringPlans)

export default userBike
