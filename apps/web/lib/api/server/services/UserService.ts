import { createUserId } from '@repo/shared-types'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IUserRepository } from '../interfaces/IUserRepository'

export class UserService {
  private _userRepository: IUserRepository

  constructor(userRepository: IUserRepository) {
    this._userRepository = userRepository
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
          notificationEmail: (authProvider.metadata?.email as string) ?? null,
          isProfilePublic: true,
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
