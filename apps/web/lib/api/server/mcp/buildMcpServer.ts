import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { prisma } from '@repo/database'
import type { ApiKeyScope } from '@repo/shared-types'
import { createUserId } from '@repo/shared-types'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { registerBikeTools } from './tools/registerBikeTools'
import { registerMaintenanceTools } from './tools/registerMaintenanceTools'
import { registerTouringHistoryTools } from './tools/registerTouringHistoryTools'
import { registerTouringPlanReadTools } from './tools/registerTouringPlanReadTools'
import { registerTouringPlanWriteTools } from './tools/registerTouringPlanWriteTools'
import type { McpToolContext } from './types'
import { SITE_URL, WEB_URL } from '@/lib/statics'

/**
 * リクエストごとにMCPサーバーを構築する
 *
 * @remarks
 * `scopes`（アクセストークン発行時点のスコープ）をそのまま信用せず、
 * ユーザーの**現在の**プランで許可されるスコープ（`userEntity.limits.allowedScopes`）
 * との積集合＝実効スコープを計算してツール登録に使う。これにより、
 * トークン発行後にプランがダウングレードされた場合でも、権限のない
 * ツールはそもそも`tools/list`に現れない。
 */
export async function buildMcpServer(
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
  const ctx: McpToolContext = { userId, userEntity }

  if (effectiveScopes.includes('READ')) {
    registerBikeTools(server, ctx)
    registerTouringPlanReadTools(server, ctx)
    registerTouringHistoryTools(server, ctx)
    registerMaintenanceTools(server, ctx)
  }

  if (effectiveScopes.includes('WRITE')) {
    registerTouringPlanWriteTools(server, ctx)
  }

  return server
}
