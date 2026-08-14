import { UserId, UserQuitStatus } from '@repo/shared-types'
import { UserQuitEntity } from '../entities/UserQuitEntity'

export interface IUserQuitRepository {
  /**
   * 退会情報を登録する
   *
   * @remarks
   * userIdごとに1レコードのみ保持する。既に退会情報が存在する場合
   * （復帰済みユーザーが再度退会した場合など）は新しい内容で上書きする。
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
