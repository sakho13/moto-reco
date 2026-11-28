import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { prisma } from '@repo/database'
import { UserBikeSearchParams } from '@repo/shared-domain'
import { PrismaMyUserBikeRepository } from '../../repositories/PrismaMyUserBikeRepository'
import { ETC_TYPE_DESCRIPTION } from '../etcTypeDescription'
import { toToolResult } from '../mcpToolResult'
import type { McpToolContext } from '../types'

/** マイバイク関連のREAD系MCPツールを登録する */
export function registerBikeTools(
  server: McpServer,
  { userId }: McpToolContext
): void {
  server.registerTool(
    'list_bikes',
    {
      description: `登録されているマイバイクの一覧を取得します。etcType はETC車載器の搭載状況です。${ETC_TYPE_DESCRIPTION}`,
    },
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
          etcType: b.etcType,
          touringCount: b.touringCount,
          updatedAt: b.updatedAt.toISOString(),
        }))
      })
  )
}
