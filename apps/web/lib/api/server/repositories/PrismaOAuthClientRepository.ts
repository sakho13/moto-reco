import {
  OAuthClientEntity,
  OAuthTokenEndpointAuthMethod,
  IOAuthClientRepository,
} from '@repo/shared-domain'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaOAuthClientRepository
  extends PrismaRepositoryBase
  implements IOAuthClientRepository
{
  async findByClientId(clientId: string): Promise<OAuthClientEntity | null> {
    const row = await this.connection.mOAuthClient.findUnique({
      where: { clientId },
    })
    return row ? toEntity(row) : null
  }

  async create(params: {
    clientId: string
    clientSecretHash: string | null
    clientName: string
    redirectUris: string[]
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod
  }): Promise<OAuthClientEntity> {
    const row = await this.connection.mOAuthClient.create({
      data: {
        clientId: params.clientId,
        clientSecretHash: params.clientSecretHash,
        clientName: params.clientName,
        redirectUris: params.redirectUris,
        tokenEndpointAuthMethod: params.tokenEndpointAuthMethod,
      },
    })
    return toEntity(row)
  }
}

function toEntity(row: {
  id: string
  clientId: string
  clientSecretHash: string | null
  clientName: string
  redirectUris: string[]
  tokenEndpointAuthMethod: string
  createdAt: Date
  updatedAt: Date
}): OAuthClientEntity {
  return new OAuthClientEntity({
    id: row.id,
    clientId: row.clientId,
    clientSecretHash: row.clientSecretHash,
    clientName: row.clientName,
    redirectUris: row.redirectUris,
    tokenEndpointAuthMethod:
      row.tokenEndpointAuthMethod as OAuthTokenEndpointAuthMethod,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}
