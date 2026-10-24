import {
  AuthProviderEntity,
  IAuthProviderRepository,
} from '@repo/shared-domain'
import { FIREBASE_LINKABLE_PROVIDER_TYPES, UserId } from '@repo/shared-types'

export type AuthProviderLinkResult =
  | { status: 'LINKED'; userId: UserId }
  | { status: 'QUIT' }
  | { status: 'NOT_FOUND' }

/**
 * 同一の Firebase UID を持つ既存ユーザーへ認証方式を紐付けるサービス
 */
export class AuthProviderLinkService {
  private _authProviderRepository: IAuthProviderRepository

  constructor(authProviderRepository: IAuthProviderRepository) {
    this._authProviderRepository = authProviderRepository
  }

  /**
   * 外部IDが一致する既存ユーザーを探し、今回の認証方式を追加する
   *
   * @remarks
   * - 有効なユーザー: 認証方式を追加して `LINKED` を返す
   * - 退会済みユーザー: 認証方式は追加せず `QUIT` を返す
   * - 該当なし、または紐付け対象外の認証方式: `NOT_FOUND` を返す
   */
  public async linkByExternalId(
    authProvider: AuthProviderEntity
  ): Promise<AuthProviderLinkResult> {
    if (!FIREBASE_LINKABLE_PROVIDER_TYPES.includes(authProvider.provider)) {
      return { status: 'NOT_FOUND' }
    }

    const user = await this._authProviderRepository.findUserStatusByExternalId(
      authProvider.externalId,
      FIREBASE_LINKABLE_PROVIDER_TYPES
    )

    if (!user) {
      return { status: 'NOT_FOUND' }
    }

    if (user.status === 'INACTIVE' && user.isQuit) {
      return { status: 'QUIT' }
    }

    if (user.status !== 'ACTIVE') {
      return { status: 'NOT_FOUND' }
    }

    await this._authProviderRepository.addProvider(
      user.userId,
      authProvider.provider,
      authProvider.externalId
    )

    return { status: 'LINKED', userId: user.userId }
  }
}
