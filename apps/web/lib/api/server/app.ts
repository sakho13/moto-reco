import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { SuccessResponse } from '@repo/shared-types'
import { ApiV1Error } from './errors/ApiV1Error'
import { OAuthError } from './errors/OAuthError'
import { HonoVariables } from './types/hono'
import ApiV1 from './v1'
import apiKeys from './v1/apiKeys'
import oauth from './v1/oauth'

const app = new Hono<{ Variables: HonoVariables }>()

// ミドルウェア
app.use('*', logger())

// バージョンヘッダーミドルウェア
app.use('*', async (c, next) => {
  await next()
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev'
  c.header('X-API-Version', version)
})

// Health check
app.get('/api/v1/health', async (c) => {
  return c.json({
    status: 'success',
    message: 'API is healthy',
    data: null,
  } satisfies SuccessResponse<null>)
})

// v1 APIルート
app.route('/api/v1', ApiV1)

// MCP APIキー管理 (/api/v1/mcp/api-keys)
app.route('/api/v1/mcp/api-keys', apiKeys)

// MCP OAuth (/api/v1/mcp/oauth)
app.route('/api/v1/mcp/oauth', oauth)

// グローバルエラーハンドラ
app.onError((err, c) => {
  const url = c.req.url

  if (err instanceof OAuthError) {
    console.error(`[OAUTH_ERROR] ${url}`, err.toErrorResponse())
    return c.json(err.toErrorResponse(), err.statusCode as ContentfulStatusCode)
  }

  if (err instanceof ApiV1Error) {
    console.error(`[API_ERROR] ${url}`, err.toErrorResponse())
    return c.json(err.toErrorResponse(), err.statusCode as ContentfulStatusCode)
  }

  console.error(`[SERVER_ERROR] ${url}`, JSON.stringify(err))
  const unknownError = new ApiV1Error('SERVER_ERROR', 'Unknown server error')
  return c.json(unknownError.toErrorResponse(), 500)
})

export { app }
