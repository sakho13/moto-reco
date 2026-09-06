import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { ApiV1Error } from '@repo/shared-domain'
import { createMyUserBikeId } from '@repo/shared-types'
import { PrismaMaintenanceLogRepository } from '../../repositories/PrismaMaintenanceLogRepository'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { MaintenanceLogService } from '../../services/MaintenanceLogService'
import { toToolResult } from '../mcpToolResult'
import type { McpToolContext } from '../types'

/** メンテナンス関連のREAD系MCPツールを登録する */
export function registerMaintenanceTools(
  server: McpServer,
  { userId }: McpToolContext
): void {
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

        return { myUserBikeId, currentMileage, maintenanceItems: items }
      })
  )
}
