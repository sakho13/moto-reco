import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { TouringSearchParams } from '@repo/shared-domain'
import { createMyUserBikeId, createTouringId } from '@repo/shared-types'
import { PrismaFuelLogRepository } from '../../repositories/PrismaFuelLogRepository'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { PrismaSpotRepository } from '../../repositories/PrismaSpotRepository'
import { PrismaTouringRepository } from '../../repositories/PrismaTouringRepository'
import { TouringService } from '../../services/TouringService'
import { toToolResult } from '../mcpToolResult'
import type { McpToolContext } from '../types'

/** ツーリング履歴のREAD系MCPツールを登録する */
export function registerTouringHistoryTools(
  server: McpServer,
  { userId }: McpToolContext
): void {
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
}
