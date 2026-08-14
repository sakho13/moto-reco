import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { PrismaSystemApiKeyRepository } from './server/repositories/PrismaSystemApiKeyRepository'
import { SystemApiKeyService } from './server/services/SystemApiKeyService'

/**
 * `MSystemApiKey` によるハッシュ照合で内部バッチAPIを保護する
 *
 * @remarks
 * GitHub Actions等からの内部バッチAPI呼び出しを想定。
 * `requireAdmin`（Firebase認証）とは独立した認証経路。
 */
export async function requireSystemApiKey(
  request: NextRequest
): Promise<{ error: NextResponse } | Record<string, never>> {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }

  const fullKey = authorization.slice(7)
  const service = new SystemApiKeyService(
    new PrismaSystemApiKeyRepository(prisma)
  )
  const isValid = await service.verifyApiKey(fullKey)

  if (!isValid) {
    return {
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {}
}
