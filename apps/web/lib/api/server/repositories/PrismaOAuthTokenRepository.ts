import { OAuthTokenEntity, IOAuthTokenRepository } from '@repo/shared-domain'
import type { ApiKeyScope } from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaOAuthTokenRepository
  extends PrismaRepositoryBase
  implements IOAuthTokenRepository
{
  async create(params: {
    accessTokenHash: string
    refreshTokenHash: string | null
    clientId: string
    userId: string
    scopes: ApiKeyScope[]
    accessTokenExpiresAt: Date
    refreshTokenExpiresAt: Date | null
  }): Promise<OAuthTokenEntity> {
    const row = await this.connection.tOAuthToken.create({
      data: {
        accessTokenHash: params.accessTokenHash,
        refreshTokenHash: params.refreshTokenHash,
        clientId: params.clientId,
        userId: params.userId,
        scopes: params.scopes,
        accessTokenExpiresAt: params.accessTokenExpiresAt,
        refreshTokenExpiresAt: params.refreshTokenExpiresAt,
      },
    })
    return toEntity(row)
  }

  async findByAccessTokenHash(
    accessTokenHash: string
  ): Promise<OAuthTokenEntity | null> {
    const row = await this.connection.tOAuthToken.findUnique({
      where: { accessTokenHash },
    })
    return row ? toEntity(row) : null
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string
  ): Promise<OAuthTokenEntity | null> {
    const row = await this.connection.tOAuthToken.findUnique({
      where: { refreshTokenHash },
    })
    return row ? toEntity(row) : null
  }

  async rotate(
    id: string,
    expectedRefreshTokenHash: string,
    params: {
      accessTokenHash: string
      refreshTokenHash: string | null
      accessTokenExpiresAt: Date
      refreshTokenExpiresAt: Date | null
    }
  ): Promise<OAuthTokenEntity | null> {
    const result = await this.connection.tOAuthToken.updateMany({
      where: { id, refreshTokenHash: expectedRefreshTokenHash },
      data: {
        accessTokenHash: params.accessTokenHash,
        refreshTokenHash: params.refreshTokenHash,
        accessTokenExpiresAt: params.accessTokenExpiresAt,
        refreshTokenExpiresAt: params.refreshTokenExpiresAt,
      },
    })
    if (result.count === 0) return null

    const row = await this.connection.tOAuthToken.findUniqueOrThrow({
      where: { id },
    })
    return toEntity(row)
  }
}

function toEntity(row: {
  id: string
  accessTokenHash: string
  refreshTokenHash: string | null
  clientId: string
  userId: string
  scopes: string[]
  revoked: boolean
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}): OAuthTokenEntity {
  return new OAuthTokenEntity({
    id: row.id,
    accessTokenHash: row.accessTokenHash,
    refreshTokenHash: row.refreshTokenHash,
    clientId: row.clientId,
    userId: row.userId,
    scopes: row.scopes as ApiKeyScope[],
    revoked: row.revoked,
    accessTokenExpiresAt: row.accessTokenExpiresAt,
    refreshTokenExpiresAt: row.refreshTokenExpiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}
