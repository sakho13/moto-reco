import type { UserId } from './user'
import type { UserPlan } from './user'

export type UserPlanHistoryId = string & { readonly brand: unique symbol }
export const createUserPlanHistoryId = (id: string): UserPlanHistoryId =>
  id as UserPlanHistoryId

export type UserPlanHistory = {
  id: UserPlanHistoryId
  userId: UserId
  plan: UserPlan
  changedAt: Date
  changedById: UserId
  reason: string | null
}
