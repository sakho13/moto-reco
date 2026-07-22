import { Context, Next } from 'hono'
import { prisma } from '@repo/database'
import { ApiV1Error } from '../errors/ApiV1Error'
import { PrismaSystemApiKeyRepository } from '../repositories/PrismaSystemApiKeyRepository'
import { SystemApiKeyService } from '../services/SystemApiKeyService'
import { HonoVariables } from '../types/hono'

/**
 * システムAPIキー（`MSystemApiKey`）による内部API保護ミドルウェア
 *
 * @remarks
 * GitHub Actions等からの内部バッチAPI呼び出しを想定。
 * Firebase認証（honoAuthMiddleware）とは独立した認証経路。
 */
export async function honoSystemApiKeyMiddleware(
  c: Context<{ Variables: HonoVariables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiV1Error('AUTH_FAILED', 'システムAPIキーが提供されていません')
  }

  const fullKey = authHeader.substring('Bearer '.length)
  const service = new SystemApiKeyService(
    new PrismaSystemApiKeyRepository(prisma)
  )
  const isValid = await service.verifyApiKey(fullKey)

  if (!isValid) {
    throw new ApiV1Error('AUTH_FAILED', 'システムAPIキーが無効です')
  }

  await next()
}
