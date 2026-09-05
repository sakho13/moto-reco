import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@repo/database'
import {
  ApiV1Error,
  TouringSearchParams,
  UserBikeSearchParams,
} from '@repo/shared-domain'
import {
  ApiKeyScope,
  createMyUserBikeId,
  createTouringId,
  createTouringPlanId,
  createTouringPlanSpotId,
  createUserId,
} from '@repo/shared-types'
import { PrismaFuelLogRepository } from './repositories/PrismaFuelLogRepository'
import { PrismaMaintenanceLogRepository } from './repositories/PrismaMaintenanceLogRepository'
import { PrismaMyUserBikeRepository } from './repositories/PrismaMyUserBikeRepository'
import { PrismaOAuthAuthorizationCodeRepository } from './repositories/PrismaOAuthAuthorizationCodeRepository'
import { PrismaOAuthClientRepository } from './repositories/PrismaOAuthClientRepository'
import { PrismaOAuthTokenRepository } from './repositories/PrismaOAuthTokenRepository'
import { PrismaSpotRepository } from './repositories/PrismaSpotRepository'
import { PrismaTouringPlanRepository } from './repositories/PrismaTouringPlanRepository'
import { PrismaTouringPlanSpotRepository } from './repositories/PrismaTouringPlanSpotRepository'
import { PrismaTouringRepository } from './repositories/PrismaTouringRepository'
import { PrismaUserRepository } from './repositories/PrismaUserRepository'
import type { TouringPlanSpotWithTimes } from './services/computeTouringPlanSpotTimes'
import { MaintenanceLogService } from './services/MaintenanceLogService'
import { OAuthAuthorizationService } from './services/OAuthAuthorizationService'
import { TouringPlanService } from './services/TouringPlanService'
import { TouringPlanSpotService } from './services/TouringPlanSpotService'
import { TouringService } from './services/TouringService'
import { SITE_URL, WEB_URL } from '@/lib/statics'

/**
 * MotoReco MCPサーバー専用のHonoアプリ
 *
 * @remarks
 * `/api/v1` を扱う共有Honoアプリ（`app.ts`）とは意図的に独立させている。
 * 共有アプリ側のミドルウェア・エラーハンドリングの変更がMCPの挙動に
 * 影響しないようにするため。
 */
export const mcpApp = new Hono()

/**
 * stateless モード用の単発リクエストトランスポート。
 * McpServer に connect() した後、start() でリクエストを流し、
 * send() で受け取ったレスポンスを Promise で返す。
 */
class SingleRequestTransport implements Transport {
  private readonly _input: JSONRPCMessage
  private _responsePromise: Promise<JSONRPCMessage>
  private _resolveResponse!: (msg: JSONRPCMessage) => void

  onmessage?: (message: JSONRPCMessage) => void
  onclose?: () => void
  onerror?: (error: Error) => void

  constructor(input: JSONRPCMessage) {
    this._input = input
    this._responsePromise = new Promise((resolve) => {
      this._resolveResponse = resolve
    })
  }

  async start(): Promise<void> {
    // onmessage は connect() 内で設定されてから start() が呼ばれる
    this.onmessage?.(this._input)
  }

  async close(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    // レスポンス（id あり）のみ解決する。通知（id なし）は無視する。
    if ('id' in message) {
      this._resolveResponse(message)
    }
  }

  getResponse(): Promise<JSONRPCMessage> {
    return this._responsePromise
  }
}

/**
 * MCPサーバーへのリクエストを認証する
 *
 * @remarks
 * Bearerトークンを OAuth アクセストークンとして検証する。
 */
async function authenticate(
  authHeader: string | undefined
): Promise<{ userId: string; scopes: ApiKeyScope[] } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length)

  const oauthService = new OAuthAuthorizationService(
    new PrismaOAuthClientRepository(prisma),
    new PrismaOAuthAuthorizationCodeRepository(prisma),
    new PrismaOAuthTokenRepository(prisma),
    new PrismaUserRepository(prisma)
  )
  return (await oauthService.verifyAccessToken(token)) ?? null
}

/** Repository/Service層が返す NOT_FOUND を MCP の isError レスポンスに変換する */
async function toToolResult(
  fn: () => Promise<unknown>
): Promise<{ content: { type: 'text'; text: string }[]; isError?: true }> {
  try {
    const data = await fn()
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  } catch (error) {
    if (error instanceof ApiV1Error) {
      return { content: [{ type: 'text', text: error.message }], isError: true }
    }
    throw error
  }
}

/** `TouringPlanSpotWithTimes` をMCPレスポンス用オブジェクトに変換する */
function toMcpSpotResult(spotWithTimes: TouringPlanSpotWithTimes) {
  const { spot, plannedArrivalOffsetMinutes, plannedDepartureOffsetMinutes } =
    spotWithTimes
  return {
    touringPlanSpotId: spot.id,
    touringPlanId: spot.touringPlanId,
    type: spot.type,
    name: spot.name,
    memo: spot.memo,
    latitude: spot.latitude,
    longitude: spot.longitude,
    plannedArrivalOffsetMinutes,
    plannedDepartureOffsetMinutes,
    stayMinutes: spot.stayMinutes,
    travelMinutesFromPrev: spot.travelMinutesFromPrev,
    routeTypeFromPrev: spot.routeTypeFromPrev,
    sortOrder: spot.sortOrder,
  }
}

async function buildMcpServer(
  rawUserId: string,
  scopes: ApiKeyScope[]
): Promise<McpServer> {
  const server = new McpServer({
    name: 'motoreco',
    title: 'MotoReco',
    version: '1.0.0',
    websiteUrl: SITE_URL,
    description:
      'バイクの給油・メンテナンス・ツーリング記録を管理するmotorecoのMCPサーバー',
    icons: [{ src: `${WEB_URL}/favicon.ico`, mimeType: 'image/x-icon' }],
  })
  const userId = createUserId(rawUserId)

  const userEntity = await new PrismaUserRepository(prisma).findById(userId)
  if (!userEntity) {
    // authenticate() が事前に有効なアクティブユーザーであることを検証済みのため
    // 通常到達しないが、念のためツール未登録の空サーバーを返す
    return server
  }

  const effectiveScopes = scopes.filter((s) =>
    userEntity.limits.allowedScopes.includes(s)
  )

  if (effectiveScopes.includes('READ')) {
    server.registerTool(
      'list_bikes',
      { description: '登録されているマイバイクの一覧を取得します' },
      async () =>
        toToolResult(async () => {
          const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
          const bikes = await myUserBikeRepo.findMyUserBikes(
            userId,
            new UserBikeSearchParams({})
          )
          return bikes.map((b) => ({
            myUserBikeId: b.myUserBikeId,
            nickname: b.nickname,
            manufacturer: b.manufacturerName,
            modelName: b.modelName,
            displacement: b.displacement,
            totalMileage: b.totalMileage,
            touringCount: b.touringCount,
            updatedAt: b.updatedAt.toISOString(),
          }))
        })
    )

    server.registerTool(
      'list_touring_plans',
      {
        description: '指定バイクのツーリングプラン一覧を取得します',
        inputSchema: { myUserBikeId: z.string().describe('マイバイクID') },
      },
      async ({ myUserBikeId }) =>
        toToolResult(async () => {
          const touringPlanRepo = new PrismaTouringPlanRepository(prisma)
          const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(
            prisma
          )
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
            userId
          )
          return plans.map(({ plan, destinationSpot }) => ({
            touringPlanId: plan.id,
            title: plan.title,
            destination: destinationSpot
              ? {
                  name: destinationSpot.name,
                  latitude: destinationSpot.latitude,
                  longitude: destinationSpot.longitude,
                }
              : null,
            updatedAt: plan.updatedAt.toISOString(),
          }))
        })
    )

    server.registerTool(
      'get_touring_plan',
      {
        description: 'ツーリングプランの詳細（スポット含む）を取得します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
        },
      },
      async ({ myUserBikeId, touringPlanId }) =>
        toToolResult(async () => {
          const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
          const touringPlanRepo = new PrismaTouringPlanRepository(prisma)
          const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(
            prisma
          )

          const myUserBike = await myUserBikeRepo.findMyUserBikeById(
            createMyUserBikeId(myUserBikeId),
            userId
          )
          if (!myUserBike) {
            throw new ApiV1Error('NOT_FOUND', 'バイクが見つかりません')
          }

          const plan = await touringPlanRepo.findPlanById(
            createTouringPlanId(touringPlanId),
            createMyUserBikeId(myUserBikeId)
          )
          if (!plan) {
            throw new ApiV1Error('NOT_FOUND', 'プランが見つかりません')
          }

          const spots = await touringPlanSpotRepo.findPlanSpotsByPlanId(plan.id)
          return {
            touringPlanId: plan.id,
            title: plan.title,
            spots: spots.map((s) => ({
              spotId: s.id,
              type: s.type,
              name: s.name,
              latitude: s.latitude,
              longitude: s.longitude,
              memo: s.memo,
              stayMinutes: s.stayMinutes,
              travelMinutesFromPrev: s.travelMinutesFromPrev,
              routeTypeFromPrev: s.routeTypeFromPrev,
              sortOrder: s.sortOrder,
            })),
          }
        })
    )

    server.registerTool(
      'list_touring_history',
      {
        description:
          '指定バイクのツーリング履歴（実施済み・実施中のツーリング記録）一覧を取得します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          status: z
            .enum(['STARTED', 'COMPLETED'])
            .optional()
            .describe('ステータスで絞り込み（省略時は全件）'),
        },
      },
      async ({ myUserBikeId, status }) =>
        toToolResult(async () => {
          const touringRepo = new PrismaTouringRepository(prisma)
          const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
          const fuelLogRepo = new PrismaFuelLogRepository(prisma)
          const service = new TouringService(
            touringRepo,
            myUserBikeRepo,
            fuelLogRepo
          )

          const tourings = await service.getTourings(
            createMyUserBikeId(myUserBikeId),
            userId,
            new TouringSearchParams({ status })
          )
          return tourings.map((t) => ({
            touringId: t.id,
            touringPlanId: t.touringPlanId,
            title: t.title,
            startDate: t.startDate.toISOString(),
            endDate: t.endDate.toISOString(),
            startMileage: t.startMileage,
            endMileage: t.endMileage,
            status: t.status,
          }))
        })
    )

    server.registerTool(
      'get_touring_history',
      {
        description: 'ツーリング履歴の詳細（スポット含む）を取得します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringId: z.string().describe('ツーリング履歴ID'),
        },
      },
      async ({ myUserBikeId, touringId }) =>
        toToolResult(async () => {
          const touringRepo = new PrismaTouringRepository(prisma)
          const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
          const fuelLogRepo = new PrismaFuelLogRepository(prisma)
          const spotRepo = new PrismaSpotRepository(prisma)
          const service = new TouringService(
            touringRepo,
            myUserBikeRepo,
            fuelLogRepo
          )

          const touring = await service.getTouringById(
            createTouringId(touringId),
            createMyUserBikeId(myUserBikeId),
            userId
          )
          const spots = await spotRepo.findSpotsByTouringId(touring.id)
          return {
            touringId: touring.id,
            touringPlanId: touring.touringPlanId,
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
            spots: spots.map((s) => ({
              spotId: s.id,
              type: s.type,
              name: s.name,
              memo: s.memo,
              latitude: s.latitude,
              longitude: s.longitude,
              arrivedAt: s.arrivedAt?.toISOString() ?? null,
              departedAt: s.departedAt?.toISOString() ?? null,
              isSkipped: s.isSkipped,
              sortOrder: s.sortOrder,
            })),
          }
        })
    )

    server.registerTool(
      'get_maintenance_status',
      {
        description: 'バイクのメンテナンス状況と次回推奨時期を取得します',
        inputSchema: { myUserBikeId: z.string().describe('マイバイクID') },
      },
      async ({ myUserBikeId }) =>
        toToolResult(async () => {
          const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
          const maintenanceLogRepo = new PrismaMaintenanceLogRepository(prisma)
          const maintenanceLogService = new MaintenanceLogService(
            maintenanceLogRepo,
            myUserBikeRepo
          )

          const myUserBike = await myUserBikeRepo.findMyUserBikeById(
            createMyUserBikeId(myUserBikeId),
            userId
          )
          if (!myUserBike) {
            throw new ApiV1Error('NOT_FOUND', 'バイクが見つかりません')
          }

          // 推奨整備間隔は車種マスタ(MBike)側のデータであり、
          // ユーザー所有データ用のRepository層には未対応のため直接参照する
          const bikeMaintenanceTypes = myUserBike.bikeId
            ? ((
                await prisma.mBike.findUnique({
                  where: { id: myUserBike.bikeId },
                  select: { bikeMaintenanceTypes: true },
                })
              )?.bikeMaintenanceTypes ?? [])
            : []

          const logs = await maintenanceLogService.getAllMaintenanceLogs({
            myUserBikeId: createMyUserBikeId(myUserBikeId),
            userId,
            sortOrder: 'desc',
          })

          const latestByType: Record<
            string,
            { mileage: number; performedAt: Date }
          > = {}
          for (const log of logs) {
            for (const item of log.items) {
              if (!latestByType[item.maintenanceType]) {
                latestByType[item.maintenanceType] = {
                  mileage: log.mileage,
                  performedAt: log.performedAt,
                }
              }
            }
          }

          const currentMileage = myUserBike.totalMileage
          const items = bikeMaintenanceTypes.map((mt) => {
            const last = latestByType[mt.type]
            const nextMileage = last
              ? last.mileage + mt.recommendedMileage
              : null
            return {
              type: mt.type,
              recommendedMileage: mt.recommendedMileage,
              recommendedPeriodMonths: mt.recommendedPeriod,
              lastPerformedAt: last?.performedAt.toISOString() ?? null,
              lastPerformedMileage: last?.mileage ?? null,
              nextRecommendedMileage: nextMileage,
              overdueByMileage:
                nextMileage !== null ? currentMileage - nextMileage : null,
            }
          })

          return { myUserBikeId, currentMileage, maintenanceItems: items }
        })
    )
  }

  if (effectiveScopes.includes('WRITE')) {
    server.registerTool(
      'create_touring_plan',
      {
        description: 'ツーリングプランを新規作成します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          title: z
            .string()
            .min(1)
            .max(100)
            .describe('プランのタイトル（1〜100文字）'),
          startLocation: z
            .object({
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-180).max(180),
              name: z.string().max(100).optional(),
              memo: z.string().max(500).optional(),
            })
            .optional()
            .describe('出発地（任意）'),
          destinationLocation: z
            .object({
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-180).max(180),
              name: z.string().max(100).optional(),
              memo: z.string().max(500).optional(),
              travelMinutesFromPrev: z
                .number()
                .int()
                .min(0)
                .max(1440)
                .optional(),
              routeTypeFromPrev: z
                .enum(['GENERAL', 'HIGHWAY', 'MIXED'])
                .optional(),
            })
            .optional()
            .describe('目的地（任意）'),
        },
      },
      async ({ myUserBikeId, title, startLocation, destinationLocation }) =>
        toToolResult(async () => {
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
              user: userEntity,
              title,
              startLocation,
              destinationLocation,
            })
          })

          return {
            touringPlanId: result.plan.id,
            title: result.plan.title,
            createdAt: result.plan.createdAt.toISOString(),
            updatedAt: result.plan.updatedAt.toISOString(),
            startLocation: result.startSpot
              ? toMcpSpotResult(result.startSpot)
              : null,
            destinationLocation: result.destinationSpot
              ? toMcpSpotResult(result.destinationSpot)
              : null,
          }
        })
    )

    server.registerTool(
      'update_touring_plan',
      {
        description: 'ツーリングプランのタイトルを更新します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
          title: z
            .string()
            .min(1)
            .max(100)
            .describe('プランのタイトル（1〜100文字）'),
        },
      },
      async ({ myUserBikeId, touringPlanId, title }) =>
        toToolResult(async () => {
          const updatedPlan = await prisma.$transaction(async (t) => {
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

            return service.updatePlan({
              planId: createTouringPlanId(touringPlanId),
              myUserBikeId: createMyUserBikeId(myUserBikeId),
              userId,
              title,
            })
          })

          return {
            touringPlanId: updatedPlan.id,
            title: updatedPlan.title,
            updatedAt: updatedPlan.updatedAt.toISOString(),
          }
        })
    )

    server.registerTool(
      'delete_touring_plan',
      {
        description: 'ツーリングプランを削除します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
        },
      },
      async ({ myUserBikeId, touringPlanId }) =>
        toToolResult(async () => {
          await prisma.$transaction(async (t) => {
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
              createTouringPlanId(touringPlanId),
              createMyUserBikeId(myUserBikeId),
              userId
            )
          })

          return { touringPlanId, deleted: true }
        })
    )

    server.registerTool(
      'set_touring_plan_start_location',
      {
        description:
          'ツーリングプランの出発地を設定・更新・解除します（locationにnullを指定すると解除）',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
          location: z
            .object({
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-180).max(180),
              name: z.string().max(100).optional(),
              memo: z.string().max(500).optional(),
            })
            .nullable()
            .describe('出発地。nullを指定すると出発地の設定を解除します'),
        },
      },
      async ({ myUserBikeId, touringPlanId, location }) =>
        toToolResult(async () => {
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
              createTouringPlanId(touringPlanId),
              createMyUserBikeId(myUserBikeId),
              userId,
              location
                ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    name: location.name ?? null,
                    memo: location.memo ?? null,
                  }
                : null
            )
          })

          return result ? toMcpSpotResult(result) : null
        })
    )

    server.registerTool(
      'set_touring_plan_destination_location',
      {
        description:
          'ツーリングプランの目的地を設定・更新・解除します（locationにnullを指定すると解除）',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
          location: z
            .object({
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-180).max(180),
              name: z.string().max(100).optional(),
              memo: z.string().max(500).optional(),
              travelMinutesFromPrev: z
                .number()
                .int()
                .min(0)
                .max(1440)
                .optional(),
              routeTypeFromPrev: z
                .enum(['GENERAL', 'HIGHWAY', 'MIXED'])
                .optional(),
            })
            .nullable()
            .describe('目的地。nullを指定すると目的地の設定を解除します'),
        },
      },
      async ({ myUserBikeId, touringPlanId, location }) =>
        toToolResult(async () => {
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
              createTouringPlanId(touringPlanId),
              createMyUserBikeId(myUserBikeId),
              userId,
              location
                ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    name: location.name ?? null,
                    memo: location.memo ?? null,
                    travelMinutesFromPrev:
                      location.travelMinutesFromPrev ?? null,
                    routeTypeFromPrev: location.routeTypeFromPrev ?? null,
                  }
                : null
            )
          })

          return result ? toMcpSpotResult(result) : null
        })
    )

    server.registerTool(
      'add_touring_plan_spot',
      {
        description: 'ツーリングプランに経由地・休憩（SPOT/BREAK）を追加します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
          type: z.enum(['SPOT', 'BREAK']).describe('スポット種別'),
          name: z.string().max(100).optional().describe('名称'),
          memo: z.string().max(500).optional().describe('メモ'),
          latitude: z.number().min(-90).max(90).optional().describe('緯度'),
          longitude: z.number().min(-180).max(180).optional().describe('経度'),
          stayMinutes: z
            .number()
            .int()
            .min(0)
            .max(1440)
            .optional()
            .describe('滞在時間（分）'),
          travelMinutesFromPrev: z
            .number()
            .int()
            .min(0)
            .max(1440)
            .optional()
            .describe('直前地点からの移動時間（分）'),
          routeTypeFromPrev: z
            .enum(['GENERAL', 'HIGHWAY', 'MIXED'])
            .optional()
            .describe('直前地点からの経路種別'),
        },
      },
      async ({
        myUserBikeId,
        touringPlanId,
        type,
        name,
        memo,
        latitude,
        longitude,
        stayMinutes,
        travelMinutesFromPrev,
        routeTypeFromPrev,
      }) =>
        toToolResult(async () => {
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
              planId: createTouringPlanId(touringPlanId),
              myUserBikeId: createMyUserBikeId(myUserBikeId),
              userId,
              type,
              name,
              memo,
              latitude,
              longitude,
              stayMinutes,
              travelMinutesFromPrev,
              routeTypeFromPrev,
            })
          })

          return toMcpSpotResult(result)
        })
    )

    server.registerTool(
      'update_touring_plan_spot',
      {
        description:
          'ツーリングプランの経由地・休憩（SPOT/BREAK）を更新します（省略したフィールドは変更なし、nullを指定するとクリア）',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
          spotId: z.string().describe('スポットID'),
          name: z.string().max(100).nullable().optional().describe('名称'),
          memo: z.string().max(500).nullable().optional().describe('メモ'),
          latitude: z
            .number()
            .min(-90)
            .max(90)
            .nullable()
            .optional()
            .describe('緯度'),
          longitude: z
            .number()
            .min(-180)
            .max(180)
            .nullable()
            .optional()
            .describe('経度'),
          stayMinutes: z
            .number()
            .int()
            .min(0)
            .max(1440)
            .nullable()
            .optional()
            .describe('滞在時間（分）'),
          travelMinutesFromPrev: z
            .number()
            .int()
            .min(0)
            .max(1440)
            .nullable()
            .optional()
            .describe('直前地点からの移動時間（分）'),
          routeTypeFromPrev: z
            .enum(['GENERAL', 'HIGHWAY', 'MIXED'])
            .nullable()
            .optional()
            .describe('直前地点からの経路種別'),
        },
      },
      async ({
        myUserBikeId,
        touringPlanId,
        spotId,
        name,
        memo,
        latitude,
        longitude,
        stayMinutes,
        travelMinutesFromPrev,
        routeTypeFromPrev,
      }) =>
        toToolResult(async () => {
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
              planId: createTouringPlanId(touringPlanId),
              myUserBikeId: createMyUserBikeId(myUserBikeId),
              userId,
              name,
              memo,
              latitude,
              longitude,
              stayMinutes,
              travelMinutesFromPrev,
              routeTypeFromPrev,
            })
          })

          return toMcpSpotResult(result)
        })
    )

    server.registerTool(
      'delete_touring_plan_spot',
      {
        description: 'ツーリングプランの経由地・休憩（SPOT/BREAK）を削除します',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
          spotId: z.string().describe('スポットID'),
        },
      },
      async ({ myUserBikeId, touringPlanId, spotId }) =>
        toToolResult(async () => {
          await prisma.$transaction(async (t) => {
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
              createTouringPlanId(touringPlanId),
              createMyUserBikeId(myUserBikeId),
              userId
            )
          })

          return { spotId, deleted: true }
        })
    )

    server.registerTool(
      'reorder_touring_plan_spots',
      {
        description:
          'ツーリングプランの経由地・休憩（SPOT/BREAK）を指定順に並び替えます',
        inputSchema: {
          myUserBikeId: z.string().describe('マイバイクID'),
          touringPlanId: z.string().describe('ツーリングプランID'),
          spotIds: z
            .array(z.string())
            .min(1)
            .describe('並び替え後の順序で並んだスポットIDの配列'),
        },
      },
      async ({ myUserBikeId, touringPlanId, spotIds }) =>
        toToolResult(async () => {
          const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(
            prisma
          )
          const touringPlanRepo = new PrismaTouringPlanRepository(prisma)
          const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
          const service = new TouringPlanSpotService(
            touringPlanSpotRepo,
            touringPlanRepo,
            myUserBikeRepo
          )

          await service.reorderPlanSpots(
            spotIds,
            createTouringPlanId(touringPlanId),
            createMyUserBikeId(myUserBikeId),
            userId
          )

          const spots = await service.getPlanSpots(
            createTouringPlanId(touringPlanId),
            createMyUserBikeId(myUserBikeId),
            userId
          )

          return spots.map(toMcpSpotResult)
        })
    )
  }

  return server
}

mcpApp.post('/api/mcp', async (c) => {
  const auth = await authenticate(c.req.header('Authorization'))
  if (!auth) {
    c.header(
      'WWW-Authenticate',
      `Bearer resource_metadata="${WEB_URL}/.well-known/oauth-protected-resource"`
    )
    return c.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Unauthorized: 有効なOAuthアクセストークンが必要です',
        },
        id: null,
      },
      401
    )
  }

  let body: JSONRPCMessage
  try {
    body = (await c.req.json()) as JSONRPCMessage
  } catch {
    return c.json(
      {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      },
      400
    )
  }

  // 通知（id なし）は 202 で受理のみ
  if (!('id' in body)) {
    return c.body(null, 202)
  }

  const transport = new SingleRequestTransport(body)
  const server = await buildMcpServer(auth.userId, auth.scopes)

  await server.connect(transport)
  const response = await transport.getResponse()
  await server.close()

  return c.json(response)
})
