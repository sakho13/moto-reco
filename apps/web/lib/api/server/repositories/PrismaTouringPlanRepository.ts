import {
  createMyUserBikeId,
  createTouringPlanId,
  MyUserBikeId,
  TouringPlanId,
} from '@repo/shared-types'
import { TouringPlanEntity } from '../entities/TouringPlanEntity'
import { ITouringPlanRepository } from '../interfaces/ITouringPlanRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const touringPlanSelect = {
  id: true,
  userMyBikeId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
} as const

type TouringPlanRow = {
  id: string
  userMyBikeId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

const toTouringPlanEntity = (row: TouringPlanRow): TouringPlanEntity =>
  new TouringPlanEntity({
    touringPlanId: createTouringPlanId(row.id),
    myUserBikeId: createMyUserBikeId(row.userMyBikeId),
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })

/**
 * ツーリングプラン（再利用可能なルートテンプレート）のPrisma実装リポジトリ
 */
export class PrismaTouringPlanRepository
  extends PrismaRepositoryBase
  implements ITouringPlanRepository
{
  async createPlan(plan: TouringPlanEntity): Promise<TouringPlanEntity> {
    const created = await this.connection.tUserMyBikeTouringPlan.create({
      data: {
        userMyBikeId: plan.myUserBikeId,
        title: plan.title,
      },
      select: touringPlanSelect,
    })

    return toTouringPlanEntity(created)
  }

  async updatePlan(plan: TouringPlanEntity): Promise<TouringPlanEntity> {
    const updated = await this.connection.tUserMyBikeTouringPlan.update({
      where: { id: plan.id },
      data: {
        title: plan.title,
      },
      select: touringPlanSelect,
    })

    return toTouringPlanEntity(updated)
  }

  async findPlans(myUserBikeId: MyUserBikeId): Promise<TouringPlanEntity[]> {
    const plans = await this.connection.tUserMyBikeTouringPlan.findMany({
      where: { userMyBikeId: myUserBikeId },
      select: touringPlanSelect,
      orderBy: { createdAt: 'desc' },
    })

    return plans.map(toTouringPlanEntity)
  }

  async findPlanById(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId
  ): Promise<TouringPlanEntity | null> {
    const plan = await this.connection.tUserMyBikeTouringPlan.findFirst({
      where: { id: planId, userMyBikeId: myUserBikeId },
      select: touringPlanSelect,
    })

    if (!plan) return null

    return toTouringPlanEntity(plan)
  }

  async deletePlan(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId
  ): Promise<void> {
    await this.connection.tUserMyBikeTouringPlan.deleteMany({
      where: { id: planId, userMyBikeId: myUserBikeId },
    })
  }

  async countPlans(myUserBikeId: MyUserBikeId): Promise<number> {
    return this.connection.tUserMyBikeTouringPlan.count({
      where: { userMyBikeId: myUserBikeId },
    })
  }
}
