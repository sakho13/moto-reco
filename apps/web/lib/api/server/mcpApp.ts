import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { Hono } from 'hono'
import { authenticateMcpRequest } from './mcp/authenticateMcpRequest'
import { buildMcpServer } from './mcp/buildMcpServer'
import { SingleRequestTransport } from './mcp/singleRequestTransport'
import { WEB_URL } from '@/lib/statics'

/**
 * MotoReco MCPサーバー専用のHonoアプリ
 *
 * @remarks
 * `/api/v1` を扱う共有Honoアプリ（`app.ts`）とは意図的に独立させている。
 * 共有アプリ側のミドルウェア・エラーハンドリングの変更がMCPの挙動に
 * 影響しないようにするため。
 *
 * ツール登録などの実装本体は `./mcp/` 配下に分割されている
 * （`buildMcpServer.ts` がドメインごとの `registerXxxTools` を呼び出す）。
 * このファイルはHonoルーティングの配線のみを担う。
 */
export const mcpApp = new Hono()

mcpApp.post('/api/mcp', async (c) => {
  const auth = await authenticateMcpRequest(c.req.header('Authorization'))
  if (!auth) {
    c.header(
      'WWW-Authenticate',
      `Bearer resource_metadata="${WEB_URL}/.well-known/oauth-protected-resource"`
    )
    return c.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Unauthorized: 有効なOAuthアクセストークンが必要です',
        },
        id: null,
      },
      401
    )
  }

  let body: JSONRPCMessage
  try {
    body = (await c.req.json()) as JSONRPCMessage
  } catch {
    return c.json(
      {
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      },
      400
    )
  }

  // 通知（id なし）は 202 で受理のみ
  if (!('id' in body)) {
    return c.body(null, 202)
  }

  const transport = new SingleRequestTransport(body)
  const server = await buildMcpServer(auth.userId, auth.scopes)

  await server.connect(transport)
  const response = await transport.getResponse()
  await server.close()

  return c.json(response)
})
