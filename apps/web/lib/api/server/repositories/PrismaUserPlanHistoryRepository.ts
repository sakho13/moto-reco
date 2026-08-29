import {
  UserPlanHistoryEntity,
  IUserPlanHistoryRepository,
} from '@repo/shared-domain'
import {
  UserId,
  UserPlan,
  createUserId,
  createUserPlanHistoryId,
} from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaUserPlanHistoryRepository
  extends PrismaRepositoryBase
  implements IUserPlanHistoryRepository
{
  async findCurrentPlanByUserId(userId: UserId): Promise<UserPlan | null> {
    const record = await this.connection.tUserPlanHistory.findFirst({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      select: { plan: true },
    })
    return record?.plan ?? null
  }

  async findHistoriesByUserId(
    userId: UserId
  ): Promise<UserPlanHistoryEntity[]> {
    const records = await this.connection.tUserPlanHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        plan: true,
        changedAt: true,
        changedById: true,
        reason: true,
      },
    })

    return records.map(
      (r) =>
        new UserPlanHistoryEntity({
          id: createUserPlanHistoryId(r.id),
          userId: createUserId(r.userId),
          plan: r.plan,
          changedAt: r.changedAt,
          changedById: createUserId(r.changedById),
          reason: r.reason,
        })
    )
  }

  async createPlanHistory(
    entry: UserPlanHistoryEntity
  ): Promise<UserPlanHistoryEntity> {
    const created = await this.connection.tUserPlanHistory.create({
      data: {
        userId: entry.userId,
        plan: entry.plan,
        changedById: entry.changedById,
        reason: entry.reason,
      },
      select: {
        id: true,
        userId: true,
        plan: true,
        changedAt: true,
        changedById: true,
        reason: true,
      },
    })

    return new UserPlanHistoryEntity({
      id: createUserPlanHistoryId(created.id),
      userId: createUserId(created.userId),
      plan: created.plan,
      changedAt: created.changedAt,
      changedById: createUserId(created.changedById),
      reason: created.reason,
    })
  }
}
