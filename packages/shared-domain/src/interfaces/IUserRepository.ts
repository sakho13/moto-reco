import { UserId } from '@repo/shared-types'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'

export interface IUserRepository {
  /**
   * 内部User IDからUserを取得
   */
  findById(userId: UserId): Promise<UserEntity | null>

  /**
   * 内部User IDからUserを取得（ステータス不問）
   */
  findByIdIncludingInactive(userId: UserId): Promise<UserEntity | null>

  findByAuthProvider(
    authProvider: AuthProviderEntity
  ): Promise<UserEntity | null>

  /**
   * 認証プロバイダからUserを取得（ステータス不問）
   *
   * @remarks
   * 退会済み（INACTIVE）ユーザーを「未登録」と誤判定して再登録時に
   * ユニーク制約違反を起こさないよう、登録前チェックに使用する。
   */
  findByAuthProviderIncludingInactive(
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

  /**
   * ユーザーを退会状態にする
   */
  deactivateUser(userId: UserId): Promise<void>

  /**
   * ユーザーを有効状態にする
   */
  activateUser(userId: UserId): Promise<void>

  /**
   * ゲストユーザーを作成
   */
  createGuestUser(
    user: UserEntity,
    authProvider: AuthProviderEntity
  ): Promise<UserEntity>
}
