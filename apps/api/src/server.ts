import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { SuccessResponse } from '@shared-types/index'
import ApiV1 from './api/v1/apiv1'
import { ApiV1Error } from './lib/classes/common/ApiV1Error'
import { HonoVariables } from './lib/types/hono'

const app = new Hono<{ Variables: HonoVariables }>()

// ミドルウェア
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/api/v1/health', async (c) => {
  return c.json({
    status: 'success',
    message: 'API is healthy',
    data: null,
  } satisfies SuccessResponse<null>)
})

app.route('/api/v1', ApiV1)

app.onError((err, c) => {
  if (err instanceof ApiV1Error) {
    return c.json(err.toErrorResponse(), err.statusCode as ContentfulStatusCode)
  }

  const unknownError = new ApiV1Error('SERVER_ERROR', 'Unknown server error')
  return c.json(unknownError.toErrorResponse(), 500)
})

export default app
