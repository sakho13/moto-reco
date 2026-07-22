import { UserId, UserQuitStatus } from '@repo/shared-types'
import { UserQuitEntity } from '../entities/UserQuitEntity'

export interface IUserQuitRepository {
  /**
   * 退会情報を登録する
   */
  create(userQuit: UserQuitEntity): Promise<UserQuitEntity>

  /**
   * 退会情報を取得する
   */
  findByUserId(userId: UserId): Promise<UserQuitEntity | null>

  /**
   * 復帰トークンのハッシュから退会情報を取得する
   */
  findByRecoveryTokenHash(
    recoveryTokenHash: string
  ): Promise<UserQuitEntity | null>

  /**
   * 退会情報のステータスを更新する
   */
  updateStatus(userId: UserId, status: UserQuitStatus): Promise<void>

  /**
   * 完全削除バッチ対象（status=QUIT かつ purgeAt <= now）を取得する
   */
  findPurgeTargets(now: Date): Promise<UserQuitEntity[]>
}
