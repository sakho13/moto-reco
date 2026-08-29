import {
  UserPlanHistoryEntity,
  ApiV1Error,
  IUserPlanHistoryRepository,
  IUserRepository,
} from '@repo/shared-domain'
import { UserId, UserPlan, createUserPlanHistoryId } from '@repo/shared-types'

export class UserPlanService {
  private _userRepository: IUserRepository
  private _userPlanHistoryRepository: IUserPlanHistoryRepository

  constructor(
    userRepository: IUserRepository,
    userPlanHistoryRepository: IUserPlanHistoryRepository
  ) {
    this._userRepository = userRepository
    this._userPlanHistoryRepository = userPlanHistoryRepository
  }

  /**
   * 対象ユーザーの現在のプランを取得する。
   * role !== 'USER' の場合は null を返す。
   */
  public async getCurrentPlan(userId: UserId): Promise<UserPlan | null> {
    return this._userPlanHistoryRepository.findCurrentPlanByUserId(userId)
  }

  /**
   * 対象ユーザーのプラン変更履歴を取得する。
   * role !== 'USER' の場合は空配列を返す。
   */
  public async getPlanHistories(
    userId: UserId
  ): Promise<UserPlanHistoryEntity[]> {
    return this._userPlanHistoryRepository.findHistoriesByUserId(userId)
  }

  /**
   * 対象ユーザーのプランを変更する（管理者のみ実行可能）。
   * 対象ユーザーの role が USER 以外の場合は FORBIDDEN エラーを throw する。
   */
  public async changePlan(
    targetUserId: UserId,
    newPlan: UserPlan,
    changedById: UserId,
    reason: string | null
  ): Promise<UserPlanHistoryEntity> {
    const targetUser = await this._userRepository.findById(targetUserId)
    if (!targetUser) {
      throw new ApiV1Error('NOT_FOUND', '指定されたユーザーが見つかりません')
    }
    if (targetUser.role !== 'USER') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'プラン管理は USER ロールのユーザーにのみ適用できます'
      )
    }

    return this._userPlanHistoryRepository.createPlanHistory(
      new UserPlanHistoryEntity({
        id: createUserPlanHistoryId(''),
        userId: targetUserId,
        plan: newPlan,
        changedAt: new Date(),
        changedById,
        reason,
      })
    )
  }
}
