import { createUserId, type UserId } from '@shared-types/index'
import { IUserRepository } from '../../interfaces/IUserRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'

export class PrismaUserRepository
  extends PrismaRepositoryBase
  implements IUserRepository
{
  async findById(userId: UserId): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
      },
      where: {
        id: userId,
        status: 'ACTIVE',
      },
    })

    return user
      ? new UserEntity({
          id: createUserId(user.id),
          name: user.name,
          role: user.role,
          status: user.status,
        })
      : null
  }

  async findByAuthProvider(
    authProvider: AuthProviderEntity
  ): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
      },
      where: {
        authProviders: {
          some: {
            providerType: authProvider.provider,
            externalId: authProvider.externalId,
          },
        },
        status: 'ACTIVE',
      },
    })

    return user
      ? new UserEntity({
          id: createUserId(user.id),
          name: user.name,
          role: user.role,
          status: user.status,
        })
      : null
  }

  async createUser(
    user: UserEntity,
    authProvider: AuthProviderEntity
  ): Promise<UserEntity> {
    const createdUser = await this.connection.mUser.create({
      data: {
        name: user.name,
        status: 'ACTIVE',
        role: 'USER',
        authProviders: {
          create: [
            {
              externalId: authProvider.externalId,
              providerType: authProvider.provider,
              isActive: true,
            },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
      },
    })

    return new UserEntity({
      id: createUserId(createdUser.id),
      name: createdUser.name,
      role: createdUser.role,
      status: createdUser.status,
    })
  }

  async updateUser(user: UserEntity): Promise<UserEntity> {
    const updatedUser = await this.connection.mUser.update({
      where: {
        id: user.id,
        status: 'ACTIVE',
      },
      data: {
        name: user.name,
      },
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
      },
    })

    return new UserEntity({
      id: createUserId(updatedUser.id),
      name: updatedUser.name,
      role: updatedUser.role,
      status: updatedUser.status,
    })
  }
}
