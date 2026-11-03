import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { MaintenanceLogSearchParams } from '@repo/shared-domain'
import { createMyUserBikeId, MAINTENANCE_TYPES } from '@repo/shared-types'
import { PrismaMaintenanceLogRepository } from '../../repositories/PrismaMaintenanceLogRepository'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { MaintenanceLogService } from '../../services/MaintenanceLogService'
import { MaintenanceService } from '../../services/MaintenanceService'
import { toToolResult } from '../mcpToolResult'
import type { McpToolContext } from '../types'

/** メンテナンス関連のREAD系MCPツールを登録する */
export function registerMaintenanceTools(
  server: McpServer,
  { userId }: McpToolContext
): void {
  server.registerTool(
    'list_maintenance_items',
    {
      description:
        'バイクのメンテナンス項目一覧（推奨交換間隔を含む）を取得します。各項目のtypeをlist_maintenance_logsのmaintenanceTypeに指定すると、その項目の整備履歴を取得できます',
      inputSchema: { myUserBikeId: z.string().describe('マイバイクID') },
    },
    async ({ myUserBikeId }) =>
      toToolResult(async () => {
        const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
        const service = new MaintenanceService(myUserBikeRepo)

        const items = await service.getMaintenanceItems(
          createMyUserBikeId(myUserBikeId),
          userId
        )
        return items.map((item) => ({
          type: item.type,
          typeName: item.typeName,
          category: item.category,
          categoryName: item.categoryName,
          recommendedMileageInterval: item.recommendedMileageInterval,
          recommendedPeriodMonths: item.recommendedPeriodMonths,
          description: item.description,
        }))
      })
  )

  server.registerTool(
    'list_maintenance_logs',
    {
      description:
        '指定バイクの整備履歴（メンテナンスログ）一覧を取得します。maintenanceTypeを指定するとその項目を含む履歴のみに絞り込めます',
      inputSchema: {
        myUserBikeId: z.string().describe('マイバイクID'),
        maintenanceType: z
          .enum(MAINTENANCE_TYPES)
          .optional()
          .describe(
            'メンテナンス項目で絞り込み（list_maintenance_itemsのtype。省略時は全項目）'
          ),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('ページ番号（省略時は1）'),
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('1ページあたりの件数（省略時は20、最大100）'),
        sortOrder: z
          .enum(['asc', 'desc'])
          .optional()
          .describe('実施日時の並び順（省略時はdesc＝新しい順）'),
      },
    },
    async ({ myUserBikeId, maintenanceType, page, pageSize, sortOrder }) =>
      toToolResult(async () => {
        const maintenanceLogRepo = new PrismaMaintenanceLogRepository(prisma)
        const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
        const service = new MaintenanceLogService(
          maintenanceLogRepo,
          myUserBikeRepo
        )

        const logs = await service.getMaintenanceLogs({
          myUserBikeId: createMyUserBikeId(myUserBikeId),
          userId,
          searchParams: new MaintenanceLogSearchParams({
            page,
            pageSize,
            sortOrder,
            maintenanceType,
          }),
        })
        return logs.map((log) => ({
          maintenanceLogId: log.id,
          performedAt: log.performedAt.toISOString(),
          mileage: log.mileage,
          memo: log.memo,
          items: log.items,
        }))
      })
  )
}
