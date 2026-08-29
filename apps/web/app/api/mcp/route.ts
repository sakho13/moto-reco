import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@repo/database'
import {
  ApiKeyScope,
  createMyUserBikeId,
  createTouringId,
  createTouringPlanId,
  createUserId,
} from '@repo/shared-types'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { PrismaApiKeyRepository } from '@/lib/api/server/repositories/PrismaApiKeyRepository'
import { PrismaFuelLogRepository } from '@/lib/api/server/repositories/PrismaFuelLogRepository'
import { PrismaMaintenanceLogRepository } from '@/lib/api/server/repositories/PrismaMaintenanceLogRepository'
import { PrismaMyUserBikeRepository } from '@/lib/api/server/repositories/PrismaMyUserBikeRepository'
import { PrismaOAuthAuthorizationCodeRepository } from '@/lib/api/server/repositories/PrismaOAuthAuthorizationCodeRepository'
import { PrismaOAuthClientRepository } from '@/lib/api/server/repositories/PrismaOAuthClientRepository'
import { PrismaOAuthTokenRepository } from '@/lib/api/server/repositories/PrismaOAuthTokenRepository'
import { PrismaTouringPlanRepository } from '@/lib/api/server/repositories/PrismaTouringPlanRepository'
import { PrismaTouringPlanSpotRepository } from '@/lib/api/server/repositories/PrismaTouringPlanSpotRepository'
import { PrismaTouringRepository } from '@/lib/api/server/repositories/PrismaTouringRepository'
import { ApiKeyService } from '@/lib/api/server/services/ApiKeyService'
import { MaintenanceLogService } from '@/lib/api/server/services/MaintenanceLogService'
import { OAuthAuthorizationService } from '@/lib/api/server/services/OAuthAuthorizationService'
import { TouringPlanService } from '@/lib/api/server/services/TouringPlanService'
import { TouringService } from '@/lib/api/server/services/TouringService'
import { TouringSearchParams } from '@/lib/api/server/valueObjects/TouringSearchParams'
import { UserBikeSearchParams } from '@/lib/api/server/valueObjects/UserBikeSearchParams'
import { SITE_URL, WEB_URL } from '@/lib/statics'

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
 * Bearerトークンが `mk_` で始まる場合は既存のAPIキー方式、それ以外はOAuthアクセストークンとして検証する。
 * 既存のAPIキー方式の挙動は変更しない（後方互換）。
 */
async function authenticate(
  request: NextRequest
): Promise<{ userId: string; scopes: ApiKeyScope[] } | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length)

  if (token.startsWith('mk_')) {
    const service = new ApiKeyService(new PrismaApiKeyRepository(prisma))
    return (await service.verifyApiKey(token)) ?? null
  }

  const oauthService = new OAuthAuthorizationService(
    new PrismaOAuthClientRepository(prisma),
    new PrismaOAuthAuthorizationCodeRepository(prisma),
    new PrismaOAuthTokenRepository(prisma)
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

function buildMcpServer(rawUserId: string, scopes: ApiKeyScope[]): McpServer {
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

  if (scopes.includes('READ')) {
    server.tool(
      'list_bikes',
      '登録されているマイバイクの一覧を取得します',
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

    server.tool(
      'list_touring_plans',
      '指定バイクのツーリングプラン一覧を取得します',
      { myUserBikeId: z.string().describe('マイバイクID') },
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

    server.tool(
      'get_touring_plan',
      'ツーリングプランの詳細（スポット含む）を取得します',
      {
        myUserBikeId: z.string().describe('マイバイクID'),
        touringPlanId: z.string().describe('ツーリングプランID'),
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

    server.tool(
      'list_touring_history',
      '指定バイクのツーリング履歴（実施済み・実施中のツーリング記録）一覧を取得します',
      {
        myUserBikeId: z.string().describe('マイバイクID'),
        status: z
          .enum(['STARTED', 'COMPLETED'])
          .optional()
          .describe('ステータスで絞り込み（省略時は全件）'),
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

    server.tool(
      'get_touring_history',
      'ツーリング履歴の詳細を取得します',
      {
        myUserBikeId: z.string().describe('マイバイクID'),
        touringId: z.string().describe('ツーリング履歴ID'),
      },
      async ({ myUserBikeId, touringId }) =>
        toToolResult(async () => {
          const touringRepo = new PrismaTouringRepository(prisma)
          const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
          const fuelLogRepo = new PrismaFuelLogRepository(prisma)
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
          }
        })
    )

    server.tool(
      'get_maintenance_status',
      'バイクのメンテナンス状況と次回推奨時期を取得します',
      { myUserBikeId: z.string().describe('マイバイクID') },
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

  return server
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message:
            'Unauthorized: 有効なAPIキーまたはOAuthアクセストークンが必要です',
        },
        id: null,
      },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer resource_metadata="${WEB_URL}/.well-known/oauth-protected-resource"`,
        },
      }
    )
  }

  let body: JSONRPCMessage
  try {
    body = (await request.json()) as JSONRPCMessage
  } catch {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      },
      { status: 400 }
    )
  }

  // 通知（id なし）は 202 で受理のみ
  if (!('id' in body)) {
    return new NextResponse(null, { status: 202 })
  }

  const transport = new SingleRequestTransport(body)
  const server = buildMcpServer(auth.userId, auth.scopes)

  await server.connect(transport)
  const response = await transport.getResponse()
  await server.close()

  return NextResponse.json(response)
}
