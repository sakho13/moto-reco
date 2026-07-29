import type { ProviderType, UserId } from '@repo/shared-types'

export type PurgeTargetAuthProvider = {
  externalId: string
  providerType: ProviderType
}

export interface IPurgeUserRepository {
  /**
   * ユーザーが保有する写真のStorageパス一覧を取得する
   */
  findPhotoStoragePathsByUserId(userId: UserId): Promise<string[]>

  /**
   * ユーザーの認証プロバイダ（Firebase外部ID）一覧を取得する
   */
  findAuthProvidersByUserId(userId: UserId): Promise<PurgeTargetAuthProvider[]>

  /**
   * `changedById`としてこのユーザーを参照しているプラン変更履歴を削除する
   *
   * @remarks
   * `TUserPlanHistory.changedBy` は `onDelete: Restrict` のため、
   * `deleteUser` の前に明示的に削除しておく必要がある。
   */
  deletePlanHistoryAsChangedBy(userId: UserId): Promise<void>

  /**
   * ユーザー本体を削除する（Cascade設定により大半の関連データは連鎖削除される）
   */
  deleteUser(userId: UserId): Promise<void>
}
