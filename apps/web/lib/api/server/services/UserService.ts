import {
  AuthProviderEntity,
  UserEntity,
  ApiV1Error,
  IUserRepository,
} from '@repo/shared-domain'
import { createUserId } from '@repo/shared-types'

export class UserService {
  private _userRepository: IUserRepository

  constructor(userRepository: IUserRepository) {
    this._userRepository = userRepository
  }

  /**
   * 認証プロバイダーが所有確認済みとするメールアドレスを返す
   *
   * @remarks
   * Firebase の email/password 認証はメール未確認でもトークンを発行できるため、
   * `email_verified` が true の場合のみメールアドレスを返す（Google 認証は常に確認済み）。
   *
   * @returns 確認済みのメールアドレス。未確認・未設定の場合は null
   */
  public static getVerifiedEmail(
    authProvider: AuthProviderEntity
  ): string | null {
    const email = authProvider.metadata?.email
    if (typeof email !== 'string' || email === '') return null
    return authProvider.metadata?.emailVerified === true ? email : null
  }

  /**
   * 認証プロバイダーが持つ、所有確認が済んでいないメールアドレスを返す
   *
   * @returns 未確認のメールアドレス。確認済み・未設定の場合は null
   */
  public static getUnverifiedEmail(
    authProvider: AuthProviderEntity
  ): string | null {
    const email = authProvider.metadata?.email
    if (typeof email !== 'string' || email === '') return null
    return authProvider.metadata?.emailVerified === true ? null : email
  }

  public async createUser(
    authProvider: AuthProviderEntity,
    user: {
      name: string
    }
  ): Promise<{
    status: 'EXISTS' | 'CREATED'
    user: UserEntity
  }> {
    // ステータス不問で既存判定を行い、退会済み(INACTIVE)ユーザーを
    // 「未登録」と誤判定してユニーク制約違反を起こさないようにする
    const existingUser =
      await this._userRepository.findByAuthProviderIncludingInactive(
        authProvider
      )

    if (existingUser) {
      if (existingUser.status !== 'ACTIVE') {
        throw new ApiV1Error(
          'USER_QUIT',
          '退会済みのアカウントです。ご登録のメールアドレスをご確認ください。'
        )
      }

      return {
        status: 'EXISTS',
        user: existingUser,
      }
    }

    const newUser = await this._userRepository.createUser(
      new UserEntity(
        {
          id: createUserId(''),
          name: user.name,
          role: 'USER',
          status: 'ACTIVE',
          // 所有確認済みのアドレスのみ通知先として確定する。
          // 未確認のアドレスは確認メール経由で確定させる（登録エンドポイント側で確認依頼を発行する）
          notificationEmail: UserService.getVerifiedEmail(authProvider),
          // ユーザー公開機能は廃止済み。DBカラムが残るため常に非公開で作成する
          isProfilePublic: false,
        },
        null
      ),
      authProvider
    )
    return {
      status: 'CREATED',
      user: newUser,
    }
  }

  /**
   * ゲストユーザーを作成する
   * Firebase匿名認証トークンで呼び出す
   */
  public async createGuestUser(
    authProvider: AuthProviderEntity,
    user: { name?: string }
  ): Promise<UserEntity> {
    const existingUser =
      await this._userRepository.findByAuthProvider(authProvider)

    if (existingUser) {
      return existingUser
    }

    const guestName = user.name ?? `ゲスト_${Date.now()}`

    return this._userRepository.createGuestUser(
      new UserEntity(
        {
          id: createUserId(''),
          name: guestName,
          role: 'GUEST',
          status: 'ACTIVE',
          notificationEmail: null,
          isProfilePublic: false,
        },
        null
      ),
      authProvider
    )
  }
}
