import { prisma } from '@packages/database'
import { ApiV1Error } from './lib/classes/common/ApiV1Error'
import { SuccessResponse } from '@shared-types/index'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import ApiV1 from './api/v1/apiv1'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { HonoVariables } from './lib/types/hono'

const app = new Hono<{ Variables: HonoVariables }>()

// ミドルウェア
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/api/v1/health', async (c) => {
  const databaseCheck = await checkDatabase()
  if (!databaseCheck) {
    c.status(500)
    const err = new ApiV1Error('SERVER_ERROR', 'Database connection failed')
    return c.json(err.toErrorResponse())
  }

  return c.json({
    status: 'success',
    message: 'API is healthy',
    data: {
      db: databaseCheck ? 'ok' : 'error',
    },
  } satisfies SuccessResponse<unknown>)
})

app.route('/api/v1', ApiV1)

app.onError((err, c) => {
  if (err instanceof ApiV1Error) {
    return c.json(err.toErrorResponse(), err.statusCode as ContentfulStatusCode)
  }

  const unknownError = new ApiV1Error('SERVER_ERROR', 'Unknown server error')
  return c.json(unknownError.toErrorResponse(), 500)
})

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1 as result`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

export default app
