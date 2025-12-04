import { UserId } from '@shared-types/index'
import { AuthProviderEntity } from '../classes/entities/AuthProviderEntity'
import { UserEntity } from '../classes/entities/UserEntity'

export interface IUserRepository {
  /**
   * 内部User IDからUserを取得
   */
  findById(userId: UserId): Promise<UserEntity | null>

  findByAuthProvider(
    authProvider: AuthProviderEntity
  ): Promise<UserEntity | null>

  /**
   * ユーザーを新規作成
   * @param user
   * @returns
   */
  createUser(
    user: UserEntity,
    authProvider: AuthProviderEntity
  ): Promise<UserEntity>

  /**
   * ユーザー情報を更新
   *
   * @param userId - 更新対象のユーザーID
   * @param data - 更新データ
   * @returns 更新後のUserEntity
   */
  updateUser(user: UserEntity): Promise<UserEntity>
}
