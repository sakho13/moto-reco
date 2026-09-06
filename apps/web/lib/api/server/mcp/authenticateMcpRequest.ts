import { prisma } from '@repo/database'
import type { ApiKeyScope } from '@repo/shared-types'
import { PrismaOAuthAuthorizationCodeRepository } from '../repositories/PrismaOAuthAuthorizationCodeRepository'
import { PrismaOAuthClientRepository } from '../repositories/PrismaOAuthClientRepository'
import { PrismaOAuthTokenRepository } from '../repositories/PrismaOAuthTokenRepository'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { OAuthAuthorizationService } from '../services/OAuthAuthorizationService'

/**
 * MCPサーバーへのリクエストを認証する
 *
 * @remarks
 * Bearerトークンを OAuth アクセストークンとして検証する。
 */
export async function authenticateMcpRequest(
  authHeader: string | undefined
): Promise<{ userId: string; scopes: ApiKeyScope[] } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length)

  const oauthService = new OAuthAuthorizationService(
    new PrismaOAuthClientRepository(prisma),
    new PrismaOAuthAuthorizationCodeRepository(prisma),
    new PrismaOAuthTokenRepository(prisma),
    new PrismaUserRepository(prisma)
  )
  return (await oauthService.verifyAccessToken(token)) ?? null
}
