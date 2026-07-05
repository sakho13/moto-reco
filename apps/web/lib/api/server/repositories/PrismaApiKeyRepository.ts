import type { ApiKeyScope } from '@repo/shared-types'
import { ApiKeyEntity } from '../entities/ApiKeyEntity'
import { IApiKeyRepository } from '../interfaces/IApiKeyRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaApiKeyRepository
  extends PrismaRepositoryBase
  implements IApiKeyRepository
{
  async findByUserId(userId: string): Promise<ApiKeyEntity[]> {
    const rows = await this.connection.mApiKey.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toEntity)
  }

  async findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null> {
    const row = await this.connection.mApiKey.findUnique({
      where: { keyHash },
    })
    return row ? toEntity(row) : null
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.connection.mApiKey.count({
      where: { userId, isActive: true },
    })
  }

  async create(params: {
    userId: string
    name: string
    keyHash: string
    prefix: string
    scopes: ApiKeyScope[]
  }): Promise<ApiKeyEntity> {
    const row = await this.connection.mApiKey.create({
      data: {
        userId: params.userId,
        name: params.name,
        keyHash: params.keyHash,
        prefix: params.prefix,
        scopes: params.scopes,
      },
    })
    return toEntity(row)
  }

  async revoke(apiKeyId: string, userId: string): Promise<void> {
    await this.connection.mApiKey.updateMany({
      where: { id: apiKeyId, userId },
      data: { isActive: false },
    })
  }

  async delete(apiKeyId: string, userId: string): Promise<void> {
    await this.connection.mApiKey.deleteMany({
      where: { id: apiKeyId, userId },
    })
  }
}

function toEntity(row: {
  id: string
  userId: string
  name: string
  keyHash: string
  prefix: string
  scopes: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): ApiKeyEntity {
  return new ApiKeyEntity({
    id: row.id,
    userId: row.userId,
    name: row.name,
    keyHash: row.keyHash,
    prefix: row.prefix,
    scopes: row.scopes as ApiKeyScope[],
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}
