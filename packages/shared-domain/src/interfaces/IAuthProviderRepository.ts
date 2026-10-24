import { ProviderType, UserId } from '@repo/shared-types'

export interface IAuthProviderRepository {
  /**
   * ユーザーの認証方式を取得する
   */
  findProviderTypeByUserId(userId: UserId): Promise<ProviderType | null>

  /**
   * ユーザーの認証方式を更新する
   */
  updateProviderType(userId: UserId, providerType: ProviderType): Promise<void>
}
