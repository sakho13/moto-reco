import { ProviderType } from '@repo/shared-types'

export interface IFirebaseAccountRepository {
  /**
   * Firebase アカウントに紐付いている切り替え可能な認証方式を取得する
   */
  findLinkedProviderTypes(externalId: string): Promise<ProviderType[]>

  /**
   * Firebase アカウントから指定した認証方式の紐付けを外す
   */
  unlinkProviders(
    externalId: string,
    providerTypes: readonly ProviderType[]
  ): Promise<void>

  /**
   * Firebase アカウントのメールアドレスが空の場合、指定した認証方式のメールアドレスを設定する
   *
   * @remarks
   * Firebase は password の紐付けを外すとアカウントのメールアドレスも削除する。
   */
  restoreEmailFromProvider(
    externalId: string,
    providerType: ProviderType
  ): Promise<void>
}
