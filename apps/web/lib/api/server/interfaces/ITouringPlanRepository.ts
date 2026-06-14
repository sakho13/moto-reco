import { MyUserBikeId, TouringPlanId } from '@repo/shared-types'
import { TouringPlanEntity } from '../entities/TouringPlanEntity'

/**
 * ツーリングプラン（再利用可能なルートテンプレート）の永続化を担当するリポジトリ
 */
export interface ITouringPlanRepository {
  createPlan(plan: TouringPlanEntity): Promise<TouringPlanEntity>
  updatePlan(plan: TouringPlanEntity): Promise<TouringPlanEntity>
  findPlans(myUserBikeId: MyUserBikeId): Promise<TouringPlanEntity[]>
  findPlanById(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId
  ): Promise<TouringPlanEntity | null>
  deletePlan(planId: TouringPlanId, myUserBikeId: MyUserBikeId): Promise<void>
}
