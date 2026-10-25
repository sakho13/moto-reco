import {
  ApiV1Error,
  IAuthProviderRepository,
  IFirebaseAccountRepository,
  UserEntity,
} from '@repo/shared-domain'
import {
  FIREBASE_LINKABLE_PROVIDER_TYPES,
  ProviderTypeMap,
  type ProviderType,
} from '@repo/shared-types'

export type AuthProviderSwitchResult = {
  providerType: ProviderType
  switched: boolean
}

/**
 * ユーザーの認証方式を切り替えるサービス
 */
export class AuthProviderSwitchService {
  private _authProviderRepository: IAuthProviderRepository
  private _firebaseAccountRepository: IFirebaseAccountRepository

  constructor(
    authProviderRepository: IAuthProviderRepository,
    firebaseAccountRepository: IFirebaseAccountRepository
  ) {
    this._authProviderRepository = authProviderRepository
    this._firebaseAccountRepository = firebaseAccountRepository
  }

  /**
   * 認証方式を切り替える
   *
   * @remarks
   * - 切り替え先が Firebase アカウントに紐付いていない場合は INVALID_REQUEST
   * - 切り替え先以外の認証方式は Firebase アカウントから外す
   * - `switched` は DB の認証方式が変わったかどうか
   */
  public async switchProvider(
    user: UserEntity,
    externalId: string,
    providerType: ProviderType
  ): Promise<AuthProviderSwitchResult> {
    if (user.role === 'GUEST') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'ゲストアカウントは認証方式を切り替えられません'
      )
    }

    if (!FIREBASE_LINKABLE_PROVIDER_TYPES.includes(providerType)) {
      throw new ApiV1Error('INVALID_REQUEST', '切り替え先の認証方式が不正です')
    }

    const linkedProviderTypes =
      await this._firebaseAccountRepository.findLinkedProviderTypes(externalId)

    if (!linkedProviderTypes.includes(providerType)) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '切り替え先の認証方式が紐付いていません'
      )
    }

    const providerTypesToUnlink = linkedProviderTypes.filter(
      (linked) => linked !== providerType
    )
    if (providerTypesToUnlink.length > 0) {
      await this._firebaseAccountRepository.unlinkProviders(
        externalId,
        providerTypesToUnlink
      )
    }

    if (providerType === ProviderTypeMap.FIREBASE_GOOGLE) {
      await this._firebaseAccountRepository.restoreEmailFromProvider(
        externalId,
        providerType
      )
    }

    const currentProviderType =
      await this._authProviderRepository.findProviderTypeByUserId(user.id)

    if (currentProviderType === providerType) {
      return { providerType, switched: false }
    }

    await this._authProviderRepository.updateProviderType(user.id, providerType)
    return { providerType, switched: true }
  }
}
