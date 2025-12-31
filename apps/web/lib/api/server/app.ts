import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { SuccessResponse } from '@repo/shared-types'
import { ApiV1Error } from './errors/ApiV1Error'
import { HonoVariables } from './types/hono'
import ApiV1 from './v1'

const app = new Hono<{ Variables: HonoVariables }>()

// ミドルウェア
app.use('*', logger())

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

// グローバルエラーハンドラ
app.onError((err, c) => {
  if (err instanceof ApiV1Error) {
    return c.json(err.toErrorResponse(), err.statusCode as ContentfulStatusCode)
  }

  const unknownError = new ApiV1Error('SERVER_ERROR', 'Unknown server error')
  return c.json(unknownError.toErrorResponse(), 500)
})

export { app }
