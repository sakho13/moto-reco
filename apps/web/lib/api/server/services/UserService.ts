import { createUserId } from '@repo/shared-types'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'
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
    const createdUser =
      await this._userRepository.findByAuthProvider(authProvider)

    if (createdUser) {
      return {
        status: 'EXISTS',
        user: createdUser,
      }
    }

    const newUser = await this._userRepository.createUser(
      new UserEntity({
        id: createUserId(''),
        name: user.name,
        role: 'USER',
        status: 'ACTIVE',
        notificationEmail: (authProvider.metadata?.email as string) ?? null,
        isProfilePublic: true,
        timezone: null,
      }),
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
      new UserEntity({
        id: createUserId(''),
        name: guestName,
        role: 'GUEST',
        status: 'ACTIVE',
        notificationEmail: null,
        isProfilePublic: false,
        timezone: null,
      }),
      authProvider
    )
  }
}
