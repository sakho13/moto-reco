import type { UserId } from '@repo/shared-types'
import type { UserEntity } from '../entities/UserEntity'

export interface IUserFollowRepository {
  /**
   * フォロー関係を作成する
   */
  follow(followerId: UserId, followingId: UserId): Promise<void>

  /**
   * フォロー関係を削除する
   */
  unfollow(followerId: UserId, followingId: UserId): Promise<void>

  /**
   * フォロー関係が存在するか確認する
   */
  isFollowing(followerId: UserId, followingId: UserId): Promise<boolean>

  /**
   * 指定ユーザーのフォロワー一覧を取得する
   */
  findFollowers(
    userId: UserId,
    page: number,
    pageSize: number
  ): Promise<{ users: UserEntity[]; total: number }>

  /**
   * 指定ユーザーがフォロー中のユーザー一覧を取得する
   */
  findFollowing(
    userId: UserId,
    page: number,
    pageSize: number
  ): Promise<{ users: UserEntity[]; total: number }>

  /**
   * 指定ユーザーのフォロワー数を取得する
   */
  countFollowers(userId: UserId): Promise<number>

  /**
   * 指定ユーザーがフォロー中のユーザー数を取得する
   */
  countFollowing(userId: UserId): Promise<number>

  /**
   * ユーザーを名前で検索する（公開ユーザーのみ）
   */
  searchUsers(
    query: string,
    page: number,
    pageSize: number
  ): Promise<{ users: UserEntity[]; total: number }>
}
