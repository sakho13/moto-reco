import {
  OAuthAuthorizationCodeEntity,
  IOAuthAuthorizationCodeRepository,
} from '@repo/shared-domain'
import type { ApiKeyScope } from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaOAuthAuthorizationCodeRepository
  extends PrismaRepositoryBase
  implements IOAuthAuthorizationCodeRepository
{
  async create(params: {
    codeHash: string
    clientId: string
    userId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    scopes: ApiKeyScope[]
    expiresAt: Date
  }): Promise<OAuthAuthorizationCodeEntity> {
    const row = await this.connection.tOAuthAuthorizationCode.create({
      data: {
        codeHash: params.codeHash,
        clientId: params.clientId,
        userId: params.userId,
        redirectUri: params.redirectUri,
        codeChallenge: params.codeChallenge,
        codeChallengeMethod: params.codeChallengeMethod,
        scopes: params.scopes,
        expiresAt: params.expiresAt,
      },
    })
    return toEntity(row)
  }

  async findByCodeHash(
    codeHash: string
  ): Promise<OAuthAuthorizationCodeEntity | null> {
    const row = await this.connection.tOAuthAuthorizationCode.findUnique({
      where: { codeHash },
    })
    return row ? toEntity(row) : null
  }

  async markUsed(id: string): Promise<boolean> {
    const result = await this.connection.tOAuthAuthorizationCode.updateMany({
      where: { id, used: false },
      data: { used: true },
    })
    return result.count > 0
  }
}

function toEntity(row: {
  id: string
  codeHash: string
  clientId: string
  userId: string
  redirectUri: string
  codeChallenge: string
  codeChallengeMethod: string
  scopes: string[]
  used: boolean
  expiresAt: Date
  createdAt: Date
}): OAuthAuthorizationCodeEntity {
  return new OAuthAuthorizationCodeEntity({
    id: row.id,
    codeHash: row.codeHash,
    clientId: row.clientId,
    userId: row.userId,
    redirectUri: row.redirectUri,
    codeChallenge: row.codeChallenge,
    codeChallengeMethod: row.codeChallengeMethod,
    scopes: row.scopes as ApiKeyScope[],
    used: row.used,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  })
}
