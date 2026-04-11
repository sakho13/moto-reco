import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { SuccessResponse } from '@repo/shared-types'
import { ApiAdminError } from './errors/ApiAdminError'
import { HonoVariables } from './types/hono'
import ApiAdminV1 from './v1'

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
app.get('/api/admin/v1/health', async (c) => {
  return c.json({
    status: 'success',
    message: 'Admin API is healthy',
    data: null,
  } satisfies SuccessResponse<null>)
})

// v1 管理者APIルート
app.route('/api/admin/v1', ApiAdminV1)

// グローバルエラーハンドラ
app.onError((err, c) => {
  const url = c.req.url

  if (err instanceof ApiAdminError) {
    console.error(`[ADMIN_API_ERROR] ${url}`, err.toErrorResponse())
    return c.json(err.toErrorResponse(), err.statusCode as ContentfulStatusCode)
  }

  console.error(`[ADMIN_SERVER_ERROR] ${url}`, JSON.stringify(err))
  const unknownError = new ApiAdminError('SERVER_ERROR', 'Unknown server error')
  return c.json(unknownError.toErrorResponse(), 500)
})

export { app }
