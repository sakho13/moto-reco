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
   * 退会情報のステータスを更新する
   */
  updateStatus(userId: UserId, status: UserQuitStatus): Promise<void>
}
