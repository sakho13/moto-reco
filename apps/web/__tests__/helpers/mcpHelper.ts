import { createHash, randomBytes } from 'crypto'
import { prisma } from '@repo/database'
import type { ApiKeyScope } from '@repo/shared-types'

/**
 * テスト用のMCPアクセストークンを直接DBに発行する
 *
 * @remarks
 * DCR登録〜同意画面〜認可コード交換までのOAuthフロー全体は
 * OAuthAuthorizationService/OAuthClientServiceのユニットテストで検証済みのため、
 * ここでは/api/mcpの認証・ツール呼び出し検証に必要なアクセストークンのみを
 * 直接作成する。
 */
export async function issueTestMcpAccessToken(
  userId: string,
  scopes: ApiKeyScope[] = ['READ']
): Promise<string> {
  const client = await prisma.mOAuthClient.create({
    data: {
      clientId: `mcpc_test_${randomBytes(8).toString('hex')}`,
      clientSecretHash: null,
      clientName: 'Test Client',
      redirectUris: ['https://example.com/callback'],
      tokenEndpointAuthMethod: 'NONE',
    },
  })

  const accessToken = `mcpat_${randomBytes(32).toString('base64url')}`
  await prisma.tOAuthToken.create({
    data: {
      accessTokenHash: createHash('sha256').update(accessToken).digest('hex'),
      refreshTokenHash: null,
      clientId: client.id,
      userId,
      scopes,
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      refreshTokenExpiresAt: null,
    },
  })

  return accessToken
}
