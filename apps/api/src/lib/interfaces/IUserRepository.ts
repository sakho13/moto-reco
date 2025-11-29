import { AuthProviderEntity } from '../classes/entities/AuthProviderEntity'
import { UserEntity } from '../classes/entities/UserEntity'

export interface IUserRepository {
  findByAuthProvider(
    authProvider: AuthProviderEntity
  ): Promise<UserEntity | null>

  // createUser(user: UserEntity): Promise<UserEntity>

  // updateUser(user: UserEntity): Promise<UserEntity>

  // deactivateUser(userId: string): Promise<void>
}
