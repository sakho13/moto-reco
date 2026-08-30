import { UserId, UserPlan } from '@repo/shared-types'
import { UserPlanHistoryEntity } from '../entities/UserPlanHistoryEntity'

export interface IUserPlanHistoryRepository {
  /**
   * 最新のプランを取得する。
   * role === 'USER' 以外のユーザーはレコードを持たないため null を返す。
   */
  findCurrentPlanByUserId(userId: UserId): Promise<UserPlan | null>

  /**
   * プラン変更履歴を新しい順で取得する
   */
  findHistoriesByUserId(userId: UserId): Promise<UserPlanHistoryEntity[]>

  /**
   * プラン変更履歴レコードを作成する
   */
  createPlanHistory(
    entry: UserPlanHistoryEntity
  ): Promise<UserPlanHistoryEntity>
}
