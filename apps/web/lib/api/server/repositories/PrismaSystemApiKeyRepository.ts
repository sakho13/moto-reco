import { SystemApiKeyEntity } from '../entities/SystemApiKeyEntity'
import { ISystemApiKeyRepository } from '../interfaces/ISystemApiKeyRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaSystemApiKeyRepository
  extends PrismaRepositoryBase
  implements ISystemApiKeyRepository
{
  async findAll(): Promise<SystemApiKeyEntity[]> {
    const rows = await this.connection.mSystemApiKey.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toEntity)
  }

  async findByKeyHash(keyHash: string): Promise<SystemApiKeyEntity | null> {
    const row = await this.connection.mSystemApiKey.findUnique({
      where: { keyHash },
    })
    return row ? toEntity(row) : null
  }

  async create(params: {
    name: string
    keyHash: string
    prefix: string
  }): Promise<SystemApiKeyEntity> {
    const row = await this.connection.mSystemApiKey.create({
      data: {
        name: params.name,
        keyHash: params.keyHash,
        prefix: params.prefix,
      },
    })
    return toEntity(row)
  }

  async updateIsActive(
    id: string,
    isActive: boolean
  ): Promise<SystemApiKeyEntity> {
    const row = await this.connection.mSystemApiKey.update({
      where: { id },
      data: { isActive },
    })
    return toEntity(row)
  }

  async touchLastUsedAt(id: string, lastUsedAt: Date): Promise<void> {
    await this.connection.mSystemApiKey.update({
      where: { id },
      data: { lastUsedAt },
    })
  }
}

function toEntity(row: {
  id: string
  name: string
  keyHash: string
  prefix: string
  isActive: boolean
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): SystemApiKeyEntity {
  return new SystemApiKeyEntity({
    id: row.id,
    name: row.name,
    keyHash: row.keyHash,
    prefix: row.prefix,
    isActive: row.isActive,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}
