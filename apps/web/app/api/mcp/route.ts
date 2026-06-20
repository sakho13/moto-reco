import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { PrismaApiKeyRepository } from '@/lib/api/server/repositories/PrismaApiKeyRepository'
import { ApiKeyService } from '@/lib/api/server/services/ApiKeyService'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, unknown>
  id?: string | number | null
}

type JsonRpcResponse = {
  jsonrpc: '2.0'
  result?: unknown
  error?: { code: number; message: string }
  id: string | number | null
}

const TOOLS = [
  {
    name: 'list_bikes',
    description: '登録されているマイバイクの一覧を取得します',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_touring_plans',
    description: '指定バイクのツーリングプラン一覧を取得します',
    inputSchema: {
      type: 'object',
      properties: {
        myUserBikeId: { type: 'string', description: 'マイバイクID' },
      },
      required: ['myUserBikeId'],
    },
  },
  {
    name: 'get_touring_plan',
    description: 'ツーリングプランの詳細（スポット含む）を取得します',
    inputSchema: {
      type: 'object',
      properties: {
        touringPlanId: { type: 'string', description: 'ツーリングプランID' },
      },
      required: ['touringPlanId'],
    },
  },
  {
    name: 'get_maintenance_status',
    description: 'バイクのメンテナンス状況と次回推奨時期を取得します',
    inputSchema: {
      type: 'object',
      properties: {
        myUserBikeId: { type: 'string', description: 'マイバイクID' },
      },
      required: ['myUserBikeId'],
    },
  },
]

async function authenticate(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  const service = new ApiKeyService(new PrismaApiKeyRepository(prisma))
  return (await service.verifyApiKey(token))?.userId ?? null
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
  userId: string
): Promise<{ content: { type: 'text'; text: string }[]; isError?: boolean }> {
  if (name === 'list_bikes') {
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
  }

  if (name === 'list_touring_plans') {
    const myUserBikeId = args['myUserBikeId'] as string
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

  if (name === 'get_touring_plan') {
    const touringPlanId = args['touringPlanId'] as string
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

  if (name === 'get_maintenance_status') {
    const myUserBikeId = args['myUserBikeId'] as string
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
    const maintenanceTypes = myBike.userBike.bike?.bikeMaintenanceTypes ?? []
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

  return {
    content: [{ type: 'text', text: `ツール "${name}" は見つかりません` }],
    isError: true,
  }
}

function jsonRpc(result: unknown, id: string | number | null): JsonRpcResponse {
  return { jsonrpc: '2.0', result, id }
}

function jsonRpcError(
  code: number,
  message: string,
  id: string | number | null
): JsonRpcResponse {
  return { jsonrpc: '2.0', error: { code, message }, id }
}

export async function POST(request: NextRequest) {
  const userId = await authenticate(request)
  if (!userId) {
    return NextResponse.json(
      jsonRpcError(-32001, 'Unauthorized: 有効なAPIキーが必要です', null),
      { status: 401 }
    )
  }

  let body: JsonRpcRequest
  try {
    body = (await request.json()) as JsonRpcRequest
  } catch {
    return NextResponse.json(jsonRpcError(-32700, 'Parse error', null), {
      status: 400,
    })
  }

  const id = body.id ?? null

  // 通知（id なし）は 202 で受理のみ
  if (body.id === undefined) {
    return new NextResponse(null, { status: 202 })
  }

  switch (body.method) {
    case 'initialize':
      return NextResponse.json(
        jsonRpc(
          {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'motoreco', version: '1.0.0' },
          },
          id
        )
      )

    case 'tools/list':
      return NextResponse.json(jsonRpc({ tools: TOOLS }, id))

    case 'tools/call': {
      const params = body.params ?? {}
      const toolName = params['name'] as string
      const toolArgs = (params['arguments'] ?? {}) as Record<string, unknown>
      try {
        const result = await callTool(toolName, toolArgs, userId)
        return NextResponse.json(jsonRpc(result, id))
      } catch (err) {
        console.error('[MCP] tools/call error:', err)
        return NextResponse.json(jsonRpcError(-32603, 'Internal error', id), {
          status: 500,
        })
      }
    }

    default:
      return NextResponse.json(jsonRpcError(-32601, 'Method not found', id), {
        status: 404,
      })
  }
}
