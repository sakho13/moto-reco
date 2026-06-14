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
  departAt: true,
  returnAt: true,
} as const

type TouringPlanRow = {
  id: string
  userMyBikeId: string
  title: string
  departAt: Date
  returnAt: Date
}

const toTouringPlanEntity = (row: TouringPlanRow): TouringPlanEntity =>
  new TouringPlanEntity({
    touringPlanId: createTouringPlanId(row.id),
    myUserBikeId: createMyUserBikeId(row.userMyBikeId),
    title: row.title,
    departAt: row.departAt,
    returnAt: row.returnAt,
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
        departAt: plan.departAt,
        returnAt: plan.returnAt,
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
        departAt: plan.departAt,
        returnAt: plan.returnAt,
      },
      select: touringPlanSelect,
    })

    return toTouringPlanEntity(updated)
  }

  async findPlans(myUserBikeId: MyUserBikeId): Promise<TouringPlanEntity[]> {
    const plans = await this.connection.tUserMyBikeTouringPlan.findMany({
      where: { userMyBikeId: myUserBikeId },
      select: touringPlanSelect,
      orderBy: { departAt: 'asc' },
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
}
