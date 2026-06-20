import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { PrismaApiKeyRepository } from '@/lib/api/server/repositories/PrismaApiKeyRepository'
import { ApiKeyService } from '@/lib/api/server/services/ApiKeyService'

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

async function authenticate(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length)
  const service = new ApiKeyService(new PrismaApiKeyRepository(prisma))
  return (await service.verifyApiKey(token))?.userId ?? null
}

function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: 'motoreco',
    version: '1.0.0',
  })

  server.tool('list_bikes', '登録されているマイバイクの一覧を取得します', async () => {
    const bikes = await prisma.tUserMyBike.findMany({
      where: { userId, ownStatus: 'OWN' },
      include: {
        userBike: {
          include: { bike: { include: { manufacturer: true } } },
        },
      },
      orderBy: { ownedAt: 'desc' },
    })
    const data = bikes.map((b) => ({
      myUserBikeId: b.id,
      nickname: b.nickname ?? null,
      manufacturer: b.userBike.bike?.manufacturer.name ?? null,
      modelName: b.userBike.bike?.modelName ?? null,
      displacement: b.userBike.displacement,
      totalMileage: b.userBike.totalMileage,
      ownedAt: b.ownedAt.toISOString(),
    }))
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  })

  server.tool(
    'list_touring_plans',
    '指定バイクのツーリングプラン一覧を取得します',
    { myUserBikeId: z.string().describe('マイバイクID') },
    async ({ myUserBikeId }) => {
      const plans = await prisma.tUserMyBikeTouringPlan.findMany({
        where: { userMyBikeId: myUserBikeId, userMyBike: { userId } },
        include: {
          spots: {
            where: { type: 'DESTINATION' },
            select: { name: true, latitude: true, longitude: true },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
      const data = plans.map((p) => ({
        touringPlanId: p.id,
        title: p.title,
        destination: p.spots[0]
          ? {
              name: p.spots[0].name,
              latitude: p.spots[0].latitude,
              longitude: p.spots[0].longitude,
            }
          : null,
        updatedAt: p.updatedAt.toISOString(),
      }))
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    'get_touring_plan',
    'ツーリングプランの詳細（スポット含む）を取得します',
    { touringPlanId: z.string().describe('ツーリングプランID') },
    async ({ touringPlanId }) => {
      const plan = await prisma.tUserMyBikeTouringPlan.findFirst({
        where: { id: touringPlanId, userMyBike: { userId } },
        include: { spots: { orderBy: { sortOrder: 'asc' } } },
      })
      if (!plan) {
        return {
          content: [{ type: 'text', text: 'プランが見つかりません' }],
          isError: true,
        }
      }
      const data = {
        touringPlanId: plan.id,
        title: plan.title,
        spots: plan.spots.map((s) => ({
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
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    'get_maintenance_status',
    'バイクのメンテナンス状況と次回推奨時期を取得します',
    { myUserBikeId: z.string().describe('マイバイクID') },
    async ({ myUserBikeId }) => {
      const myBike = await prisma.tUserMyBike.findFirst({
        where: { id: myUserBikeId, userId },
        include: {
          userBike: {
            include: { bike: { include: { bikeMaintenanceTypes: true } } },
          },
        },
      })
      if (!myBike) {
        return {
          content: [{ type: 'text', text: 'バイクが見つかりません' }],
          isError: true,
        }
      }
      const latestLogs = await prisma.tUserMyBikeMaintenance.findMany({
        where: { userMyBikeId: myUserBikeId },
        include: { maintenanceItems: true },
        orderBy: { performedAt: 'desc' },
      })
      const latestByType: Record<string, { mileage: number; performedAt: Date }> =
        {}
      for (const log of latestLogs) {
        for (const item of log.maintenanceItems) {
          if (!latestByType[item.type]) {
            latestByType[item.type] = {
              mileage: log.mileage,
              performedAt: log.performedAt,
            }
          }
        }
      }
      const currentMileage = myBike.userBike.totalMileage
      const maintenanceTypes =
        myBike.userBike.bike?.bikeMaintenanceTypes ?? []
      const items = maintenanceTypes.map((mt) => {
        const last = latestByType[mt.type]
        const nextMileage = last ? last.mileage + mt.recommendedMileage : null
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
      const data = { myUserBikeId, currentMileage, maintenanceItems: items }
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  return server
}

export async function POST(request: NextRequest) {
  const userId = await authenticate(request)
  if (!userId) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Unauthorized: 有効なAPIキーが必要です' },
        id: null,
      },
      { status: 401 }
    )
  }

  let body: JSONRPCMessage
  try {
    body = (await request.json()) as JSONRPCMessage
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 }
    )
  }

  // 通知（id なし）は 202 で受理のみ
  if (!('id' in body)) {
    return new NextResponse(null, { status: 202 })
  }

  const transport = new SingleRequestTransport(body)
  const server = buildMcpServer(userId)

  await server.connect(transport)
  const response = await transport.getResponse()
  await server.close()

  return NextResponse.json(response)
}
