import {
  createFuelLogId,
  createHistoryId,
  createMyUserBikeId,
  createTouringId,
  createUserId,
} from '@repo/shared-types'
import { HistoryEntity } from '../entities/HistoryEntity'
import { IHistoryRepository } from '../interfaces/IHistoryRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaHistoryRepository
  extends PrismaRepositoryBase
  implements IHistoryRepository
{
  public async createHistory(
    params: Parameters<IHistoryRepository['createHistory']>[0]
  ): Promise<HistoryEntity> {
    const record = await this.connection.tUserMyBikeHistory.create({
      data: {
        userId: params.userId,
        userMyBikeId: params.userMyBikeId ?? null,
        type: params.type,
        occurredAt: params.occurredAt,
        fuelLogId: params.fuelLogId ?? null,
        touringId: params.touringId ?? null,
      },
    })

    return new HistoryEntity({
      historyId: createHistoryId(record.id),
      userId: createUserId(record.userId),
      userMyBikeId: record.userMyBikeId
        ? createMyUserBikeId(record.userMyBikeId)
        : null,
      type: record.type,
      occurredAt: record.occurredAt,
      fuelLogId: record.fuelLogId ? createFuelLogId(record.fuelLogId) : null,
      touringId: record.touringId ? createTouringId(record.touringId) : null,
    })
  }

  public async updateOccurredAtByFuelLogId(
    fuelLogId: Parameters<IHistoryRepository['updateOccurredAtByFuelLogId']>[0],
    occurredAt: Parameters<IHistoryRepository['updateOccurredAtByFuelLogId']>[1]
  ): Promise<void> {
    await this.connection.tUserMyBikeHistory.updateMany({
      where: { fuelLogId },
      data: { occurredAt },
    })
  }

  public async updateOccurredAtByTouringId(
    touringId: Parameters<IHistoryRepository['updateOccurredAtByTouringId']>[0],
    occurredAt: Parameters<IHistoryRepository['updateOccurredAtByTouringId']>[1]
  ): Promise<void> {
    await this.connection.tUserMyBikeHistory.updateMany({
      where: { touringId },
      data: { occurredAt },
    })
  }

  public async findHistoriesByMyBikeId(
    myUserBikeId: Parameters<IHistoryRepository['findHistoriesByMyBikeId']>[0]
  ): Promise<HistoryEntity[]> {
    const records = await this.connection.tUserMyBikeHistory.findMany({
      where: { userMyBikeId: myUserBikeId },
      orderBy: { occurredAt: 'desc' },
    })

    return records.map(
      (record) =>
        new HistoryEntity({
          historyId: createHistoryId(record.id),
          userId: createUserId(record.userId),
          userMyBikeId: record.userMyBikeId
            ? createMyUserBikeId(record.userMyBikeId)
            : null,
          type: record.type,
          occurredAt: record.occurredAt,
          fuelLogId: record.fuelLogId
            ? createFuelLogId(record.fuelLogId)
            : null,
          touringId: record.touringId
            ? createTouringId(record.touringId)
            : null,
        })
    )
  }
}
