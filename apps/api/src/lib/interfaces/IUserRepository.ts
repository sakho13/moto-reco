import { UserId } from '@shared-types/index'
import { AuthProviderEntity } from '../classes/entities/AuthProviderEntity'
import { UserEntity } from '../classes/entities/UserEntity'

export interface IUserRepository {
  findById(userId: UserId): Promise<UserEntity | null>

  findByAuthProvider(
    authProvider: AuthProviderEntity
  ): Promise<UserEntity | null>

  updateUser(user: UserEntity): Promise<UserEntity>
}
