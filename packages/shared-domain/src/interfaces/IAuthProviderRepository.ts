import { ProviderType, User, UserId } from '@repo/shared-types'

/**
 * 外部IDに紐付くユーザーの状態
 */
export type ExternalIdUserStatus = {
  userId: UserId
  status: User['status']
  /** 退会情報が QUIT（復帰前）かどうか */
  isQuit: boolean
}

export interface IAuthProviderRepository {
  /**
   * 指定した認証方式のいずれかで外部IDに紐付くユーザーを取得する（ステータス不問）
   */
  findUserStatusByExternalId(
    externalId: string,
    providerTypes: readonly ProviderType[]
  ): Promise<ExternalIdUserStatus | null>

  /**
   * ユーザーに認証方式を追加する
   *
   * @remarks
   * 同じ認証方式・外部IDの行が既に存在する場合は何もしない。
   */
  addProvider(
    userId: UserId,
    providerType: ProviderType,
    externalId: string
  ): Promise<void>
}
