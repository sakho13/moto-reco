import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { ApiV1Error } from '@repo/shared-domain'
import { createMyUserBikeId, createTouringPlanId } from '@repo/shared-types'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { PrismaTouringPlanRepository } from '../../repositories/PrismaTouringPlanRepository'
import { PrismaTouringPlanSpotRepository } from '../../repositories/PrismaTouringPlanSpotRepository'
import { PrismaTouringRepository } from '../../repositories/PrismaTouringRepository'
import { TouringPlanService } from '../../services/TouringPlanService'
import { toToolResult } from '../mcpToolResult'
import type { McpToolContext } from '../types'

/** ツーリングプランのREAD系MCPツールを登録する */
export function registerTouringPlanReadTools(
  server: McpServer,
  { userId }: McpToolContext
): void {
  server.registerTool(
    'list_touring_plans',
    {
      description: '指定バイクのツーリングプラン一覧を取得します',
      inputSchema: { myUserBikeId: z.string().describe('マイバイクID') },
    },
    async ({ myUserBikeId }) =>
      toToolResult(async () => {
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
        const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(prisma)

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
}
