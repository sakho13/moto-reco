import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { prisma } from '@repo/database'
import {
  createMyUserBikeId,
  createTouringPlanId,
  createTouringPlanSpotId,
} from '@repo/shared-types'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { PrismaTouringPlanRepository } from '../../repositories/PrismaTouringPlanRepository'
import { PrismaTouringPlanSpotRepository } from '../../repositories/PrismaTouringPlanSpotRepository'
import { PrismaTouringRepository } from '../../repositories/PrismaTouringRepository'
import type { TouringPlanSpotWithTimes } from '../../services/computeTouringPlanSpotTimes'
import { TouringPlanService } from '../../services/TouringPlanService'
import { TouringPlanSpotService } from '../../services/TouringPlanSpotService'
import { toToolResult } from '../mcpToolResult'
import type { McpToolContext } from '../types'

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

/** ツーリングプランのWRITE系MCPツールを登録する */
export function registerTouringPlanWriteTools(
  server: McpServer,
  { userId, userEntity }: McpToolContext
): void {
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
            travelMinutesFromPrev: z.number().int().min(0).max(1440).optional(),
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
            travelMinutesFromPrev: z.number().int().min(0).max(1440).optional(),
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
                  travelMinutesFromPrev: location.travelMinutesFromPrev ?? null,
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
        const touringPlanSpotRepo = new PrismaTouringPlanSpotRepository(prisma)
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
