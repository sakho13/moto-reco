import { createUserId } from '@packages/shared-types'
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
}
