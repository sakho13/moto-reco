import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseTouringPlanDetail,
  ApiResponseTouringPlanList,
  ApiResponseTouringPlanLocation,
  ApiResponseTouringPlanSpotDetail,
  ApiResponseTouringPlanSpotList,
  createMyUserBikeId,
  createTouringPlanId,
  createTouringPlanSpotId,
  createUserId,
  SuccessResponse,
  TouringPlanDestinationLocationUpdateRequestSchema,
  TouringPlanRegisterRequestSchema,
  TouringPlanSpotRegisterRequestSchema,
  TouringPlanSpotReorderRequestSchema,
  TouringPlanSpotUpdateRequestSchema,
  TouringPlanStartLocationUpdateRequestSchema,
  TouringPlanUpdateRequestSchema,
} from '@repo/shared-types'
import { TouringPlanSpotEntity } from '../../entities/TouringPlanSpotEntity'
import { honoAuthMiddleware } from '../../middlewares/honoAuth'
import { zodValidateJson } from '../../middlewares/zodValidation'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { PrismaTouringPlanRepository } from '../../repositories/PrismaTouringPlanRepository'
import { PrismaTouringPlanSpotRepository } from '../../repositories/PrismaTouringPlanSpotRepository'
import { PrismaTouringRepository } from '../../repositories/PrismaTouringRepository'
import { TouringPlanService } from '../../services/TouringPlanService'
import { TouringPlanSpotService } from '../../services/TouringPlanSpotService'

const userBikeTouringPlans = new Hono().basePath(
  '/bike/:myUserBikeId/touring-plans'
)

/**
 * `TouringPlanSpotEntity` を `ApiResponseTouringPlanLocation` 形式に変換する
 */
const toLocationResponse = (
  spot: TouringPlanSpotEntity
): ApiResponseTouringPlanLocation => ({
  touringPlanSpotId: spot.id,
  latitude: spot.latitude,
  longitude: spot.longitude,
  name: spot.name,
  memo: spot.memo,
  plannedArrivalAt: spot.plannedArrivalAt?.toISOString() ?? null,
  plannedDepartureAt: spot.plannedDepartureAt?.toISOString() ?? null,
})

/**
 * `TouringPlanSpotEntity` を `ApiResponseTouringPlanSpotDetail` 形式に変換する
 */
const toPlanSpotResponse = (
  spot: TouringPlanSpotEntity
): ApiResponseTouringPlanSpotDetail => ({
  touringPlanSpotId: spot.id,
  touringPlanId: spot.touringPlanId,
  type: spot.type,
  name: spot.name,
  memo: spot.memo,
  latitude: spot.latitude,
  longitude: spot.longitude,
  plannedArrivalAt: spot.plannedArrivalAt?.toISOString() ?? null,
  plannedDepartureAt: spot.plannedDepartureAt?.toISOString() ?? null,
  sortOrder: spot.sortOrder,
})

// プラン一覧取得（目的地情報を含む）
userBikeTouringPlans.get('/', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const myUserBikeId = c.req.param('myUserBikeId')

  const touringPlanRepo = new PrismaTouringPlanRepository(prisma)
  const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(prisma)
  const touringRepo = new PrismaTouringRepository(prisma)
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const service = new TouringPlanService(
    touringPlanRepo,
    touringPlanSpotRepo,
    touringRepo,
    myUserBikeRepo
  )

  const plans = await service.getPlans(
    createMyUserBikeId(myUserBikeId),
    createUserId(userId)
  )

  return c.json<SuccessResponse<ApiResponseTouringPlanList>>(
    {
      status: 'success',
      data: plans.map(({ plan, destinationSpot }) => ({
        touringPlanId: plan.id,
        title: plan.title,
        departAt: plan.departAt.toISOString(),
        returnAt: plan.returnAt.toISOString(),
        destination: destinationSpot
          ? {
              latitude: destinationSpot.latitude,
              longitude: destinationSpot.longitude,
              name: destinationSpot.name,
            }
          : null,
      })),
      message: 'ツーリングプラン一覧取得成功',
    },
    200
  )
})

// プラン新規作成（出発地・目的地は任意）
userBikeTouringPlans.post(
  '/',
  honoAuthMiddleware,
  zodValidateJson(TouringPlanRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringPlanRepo = new PrismaTouringPlanRepository(t)
      const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
      const touringRepo = new PrismaTouringRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new TouringPlanService(
        touringPlanRepo,
        touringPlanSpotRepo,
        touringRepo,
        myUserBikeRepo
      )

      return service.registerPlan({
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        title: body.title,
        departAt: body.departAt,
        startLocation: body.startLocation,
        destinationLocation: body.destinationLocation,
      })
    })

    return c.json<SuccessResponse<ApiResponseTouringPlanDetail>>(
      {
        status: 'success',
        data: {
          touringPlanId: result.plan.id,
          title: result.plan.title,
          departAt: result.plan.departAt.toISOString(),
          returnAt: result.plan.returnAt.toISOString(),
          startLocation: result.startSpot
            ? toLocationResponse(result.startSpot)
            : null,
          destinationLocation: result.destinationSpot
            ? toLocationResponse(result.destinationSpot)
            : null,
          touringIds: [],
        },
        message: 'ツーリングプラン登録成功',
      },
      201
    )
  }
)

// プラン詳細取得（出発地・目的地・関連ツーリングID一覧を含む）
userBikeTouringPlans.get('/:planId', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const myUserBikeId = c.req.param('myUserBikeId')
  const planId = c.req.param('planId')

  const touringPlanRepo = new PrismaTouringPlanRepository(prisma)
  const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(prisma)
  const touringRepo = new PrismaTouringRepository(prisma)
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const service = new TouringPlanService(
    touringPlanRepo,
    touringPlanSpotRepo,
    touringRepo,
    myUserBikeRepo
  )

  const detail = await service.getPlanById(
    createTouringPlanId(planId),
    createMyUserBikeId(myUserBikeId),
    createUserId(userId)
  )

  return c.json<SuccessResponse<ApiResponseTouringPlanDetail>>(
    {
      status: 'success',
      data: {
        touringPlanId: detail.plan.id,
        title: detail.plan.title,
        departAt: detail.plan.departAt.toISOString(),
        returnAt: detail.plan.returnAt.toISOString(),
        startLocation: detail.startSpot
          ? toLocationResponse(detail.startSpot)
          : null,
        destinationLocation: detail.destinationSpot
          ? toLocationResponse(detail.destinationSpot)
          : null,
        touringIds: detail.touringIds.map((id) => id as string),
      },
      message: 'ツーリングプラン取得成功',
    },
    200
  )
})

// プラン更新（title/departAt）
userBikeTouringPlans.patch(
  '/:planId',
  honoAuthMiddleware,
  zodValidateJson(TouringPlanUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const planId = c.req.param('planId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringPlanRepo = new PrismaTouringPlanRepository(t)
      const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
      const touringRepo = new PrismaTouringRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new TouringPlanService(
        touringPlanRepo,
        touringPlanSpotRepo,
        touringRepo,
        myUserBikeRepo
      )

      const updatedPlan = await service.updatePlan({
        planId: createTouringPlanId(planId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        title: body.title,
        departAt: body.departAt,
      })

      const [startSpot, destinationSpot, tourings] = await Promise.all([
        touringPlanSpotRepo.findPlanSpotByType(updatedPlan.id, 'START'),
        touringPlanSpotRepo.findPlanSpotByType(
          updatedPlan.id,
          'DESTINATION'
        ),
        touringRepo.findTouringsByPlanId(updatedPlan.id),
      ])

      return { plan: updatedPlan, startSpot, destinationSpot, tourings }
    })

    return c.json<SuccessResponse<ApiResponseTouringPlanDetail>>(
      {
        status: 'success',
        data: {
          touringPlanId: result.plan.id,
          title: result.plan.title,
          departAt: result.plan.departAt.toISOString(),
          returnAt: result.plan.returnAt.toISOString(),
          startLocation: result.startSpot
            ? toLocationResponse(result.startSpot)
            : null,
          destinationLocation: result.destinationSpot
            ? toLocationResponse(result.destinationSpot)
            : null,
          touringIds: result.tourings.map((t) => t.id),
        },
        message: 'ツーリングプラン更新成功',
      },
      200
    )
  }
)

// プラン削除
userBikeTouringPlans.delete('/:planId', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const myUserBikeId = c.req.param('myUserBikeId')
  const planId = c.req.param('planId')

  await prisma.$transaction((t) => {
    const touringPlanRepo = new PrismaTouringPlanRepository(t)
    const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
    const touringRepo = new PrismaTouringRepository(t)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
    const service = new TouringPlanService(
      touringPlanRepo,
      touringPlanSpotRepo,
      touringRepo,
      myUserBikeRepo
    )

    return service.deletePlan(
      createTouringPlanId(planId),
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )
  })

  return c.json<SuccessResponse<undefined>>(
    {
      status: 'success',
      data: undefined,
      message: 'ツーリングプラン削除成功',
    },
    200
  )
})

// 出発地の設定・更新・解除（body: null可）
userBikeTouringPlans.patch(
  '/:planId/start-location',
  honoAuthMiddleware,
  zodValidateJson(TouringPlanStartLocationUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const planId = c.req.param('planId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
      const touringPlanRepo = new PrismaTouringPlanRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new TouringPlanSpotService(
        touringPlanSpotRepo,
        touringPlanRepo,
        myUserBikeRepo
      )

      return service.setStartSpot(
        createTouringPlanId(planId),
        createMyUserBikeId(myUserBikeId),
        createUserId(userId),
        body
          ? {
              latitude: body.latitude,
              longitude: body.longitude,
              name: body.name ?? null,
              memo: body.memo ?? null,
              plannedDepartureAt: body.plannedDepartureAt ?? null,
            }
          : null
      )
    })

    return c.json<SuccessResponse<ApiResponseTouringPlanLocation | null>>(
      {
        status: 'success',
        data: result ? toLocationResponse(result) : null,
        message: '出発地設定成功',
      },
      200
    )
  }
)

// 目的地の設定・更新・解除（body: null可）
userBikeTouringPlans.patch(
  '/:planId/destination-location',
  honoAuthMiddleware,
  zodValidateJson(TouringPlanDestinationLocationUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const planId = c.req.param('planId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
      const touringPlanRepo = new PrismaTouringPlanRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new TouringPlanSpotService(
        touringPlanSpotRepo,
        touringPlanRepo,
        myUserBikeRepo
      )

      return service.setDestinationSpot(
        createTouringPlanId(planId),
        createMyUserBikeId(myUserBikeId),
        createUserId(userId),
        body
          ? {
              latitude: body.latitude,
              longitude: body.longitude,
              name: body.name ?? null,
              memo: body.memo ?? null,
              plannedArrivalAt: body.plannedArrivalAt ?? null,
            }
          : null
      )
    })

    return c.json<SuccessResponse<ApiResponseTouringPlanLocation | null>>(
      {
        status: 'success',
        data: result ? toLocationResponse(result) : null,
        message: '目的地設定成功',
      },
      200
    )
  }
)

// 統合ロケーション一覧取得（START/SPOT/BREAK/DESTINATION）
userBikeTouringPlans.get('/:planId/spots', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const myUserBikeId = c.req.param('myUserBikeId')
  const planId = c.req.param('planId')

  const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(prisma)
  const touringPlanRepo = new PrismaTouringPlanRepository(prisma)
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const service = new TouringPlanSpotService(
    touringPlanSpotRepo,
    touringPlanRepo,
    myUserBikeRepo
  )

  const spots = await service.getPlanSpots(
    createTouringPlanId(planId),
    createMyUserBikeId(myUserBikeId),
    createUserId(userId)
  )

  return c.json<SuccessResponse<ApiResponseTouringPlanSpotList>>(
    {
      status: 'success',
      data: spots.map(toPlanSpotResponse),
      message: 'ツーリングプランスポット一覧取得成功',
    },
    200
  )
})

// 経由地・休憩の追加
userBikeTouringPlans.post(
  '/:planId/spots',
  honoAuthMiddleware,
  zodValidateJson(TouringPlanSpotRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const planId = c.req.param('planId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
      const touringPlanRepo = new PrismaTouringPlanRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new TouringPlanSpotService(
        touringPlanSpotRepo,
        touringPlanRepo,
        myUserBikeRepo
      )

      return service.registerPlanSpot({
        planId: createTouringPlanId(planId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        type: body.type,
        name: body.name,
        memo: body.memo,
        latitude: body.latitude,
        longitude: body.longitude,
        plannedArrivalAt: body.plannedArrivalAt,
        plannedDepartureAt: body.plannedDepartureAt,
      })
    })

    return c.json<SuccessResponse<ApiResponseTouringPlanSpotDetail>>(
      {
        status: 'success',
        data: toPlanSpotResponse(result),
        message: 'ツーリングプランスポット登録成功',
      },
      201
    )
  }
)

// 経由地・休憩の並び替え（/:spotId より前に定義）
userBikeTouringPlans.patch(
  '/:planId/spots/reorder',
  honoAuthMiddleware,
  zodValidateJson(TouringPlanSpotReorderRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const planId = c.req.param('planId')
    const body = c.req.valid('json')

    const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(prisma)
    const touringPlanRepo = new PrismaTouringPlanRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new TouringPlanSpotService(
      touringPlanSpotRepo,
      touringPlanRepo,
      myUserBikeRepo
    )

    await service.reorderPlanSpots(
      body.spotIds,
      createTouringPlanId(planId),
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        data: undefined,
        message: 'ツーリングプランスポット並び替え成功',
      },
      200
    )
  }
)

// 経由地・休憩の更新
userBikeTouringPlans.patch(
  '/:planId/spots/:spotId',
  honoAuthMiddleware,
  zodValidateJson(TouringPlanSpotUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const planId = c.req.param('planId')
    const spotId = c.req.param('spotId')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
      const touringPlanRepo = new PrismaTouringPlanRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new TouringPlanSpotService(
        touringPlanSpotRepo,
        touringPlanRepo,
        myUserBikeRepo
      )

      return service.updatePlanSpot({
        spotId: createTouringPlanSpotId(spotId),
        planId: createTouringPlanId(planId),
        myUserBikeId: createMyUserBikeId(myUserBikeId),
        userId: createUserId(userId),
        name: body.name,
        memo: body.memo,
        latitude: body.latitude,
        longitude: body.longitude,
        plannedArrivalAt: body.plannedArrivalAt,
        plannedDepartureAt: body.plannedDepartureAt,
      })
    })

    return c.json<SuccessResponse<ApiResponseTouringPlanSpotDetail>>(
      {
        status: 'success',
        data: toPlanSpotResponse(result),
        message: 'ツーリングプランスポット更新成功',
      },
      200
    )
  }
)

// 経由地・休憩の削除
userBikeTouringPlans.delete(
  '/:planId/spots/:spotId',
  honoAuthMiddleware,
  async (c) => {
    const { userId } = c.var.user!
    const myUserBikeId = c.req.param('myUserBikeId')
    const planId = c.req.param('planId')
    const spotId = c.req.param('spotId')

    await prisma.$transaction((t) => {
      const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(t)
      const touringPlanRepo = new PrismaTouringPlanRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new TouringPlanSpotService(
        touringPlanSpotRepo,
        touringPlanRepo,
        myUserBikeRepo
      )

      return service.deletePlanSpot(
        createTouringPlanSpotId(spotId),
        createTouringPlanId(planId),
        createMyUserBikeId(myUserBikeId),
        createUserId(userId)
      )
    })

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        data: undefined,
        message: 'ツーリングプランスポット削除成功',
      },
      200
    )
  }
)

export default userBikeTouringPlans
