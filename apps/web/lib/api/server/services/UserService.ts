import { createUserId, ProviderType } from '@repo/shared-types'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IUserRepository } from '../interfaces/IUserRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'

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
  ): Promise<UserEntity> {
    const createdUser =
      await this._userRepository.findByAuthProvider(authProvider)

    if (createdUser) {
      return createdUser
    }

    const newUser = await this._userRepository.createUser(
      new UserEntity({
        id: createUserId(''),
        name: user.name,
        role: 'USER',
        status: 'ACTIVE',
      }),
      authProvider
    )
    return newUser
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
      }),
      authProvider
    )
  }

  /**
   * ゲストユーザーを正規ユーザーに昇格する
   * Firebase Account Linking後のトークンで呼び出す
   *
   * @param externalId - Firebase UID（匿名UID）
   * @param newProviderType - 新しい認証プロバイダータイプ
   * @param authProviderRepo - 認証プロバイダーリポジトリ
   * @param name - 更新後のユーザー名（省略可）
   */
  public async upgradeGuestUser(
    externalId: string,
    newProviderType: Exclude<ProviderType, 'FIREBASE_ANONYMOUS'>,
    authProviderRepo: PrismaAuthProviderRepository,
    name?: string
  ): Promise<UserEntity> {
    // FIREBASE_ANONYMOUS のプロバイダーを新しいプロバイダーに切り替え、userId を取得
    const userId = await authProviderRepo.upgradeGuestProviderType(
      externalId,
      newProviderType
    )

    if (!userId) {
      throw new ApiV1Error(
        'NOT_FOUND',
        'アップグレード対象のゲストアカウントが見つかりません'
      )
    }

    return this._userRepository.upgradeGuestUser(createUserId(userId), name)
  }
}
