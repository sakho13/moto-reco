import { createUserId, type UserId } from '@repo/shared-types'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'
import { IUserRepository } from '../interfaces/IUserRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

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
        notificationEmail: true,
        isProfilePublic: true,
        timezone: true,
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
          notificationEmail: user.notificationEmail,
          isProfilePublic: user.isProfilePublic,
          timezone: user.timezone,
        })
      : null
  }

  async findByIdIncludingInactive(userId: UserId): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
        notificationEmail: true,
        isProfilePublic: true,
        timezone: true,
      },
      where: {
        id: userId,
      },
    })

    return user
      ? new UserEntity({
          id: createUserId(user.id),
          name: user.name,
          role: user.role,
          status: user.status,
          notificationEmail: user.notificationEmail,
          isProfilePublic: user.isProfilePublic,
          timezone: user.timezone,
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
        notificationEmail: true,
        isProfilePublic: true,
        timezone: true,
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
          notificationEmail: user.notificationEmail,
          isProfilePublic: user.isProfilePublic,
          timezone: user.timezone,
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
        notificationEmail: user.notificationEmail,
        isProfilePublic: user.isProfilePublic,
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
        notificationEmail: true,
        isProfilePublic: true,
        timezone: true,
      },
    })

    return new UserEntity({
      id: createUserId(createdUser.id),
      name: createdUser.name,
      role: createdUser.role,
      status: createdUser.status,
      notificationEmail: createdUser.notificationEmail,
      isProfilePublic: createdUser.isProfilePublic,
      timezone: createdUser.timezone,
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
        notificationEmail: user.notificationEmail,
        isProfilePublic: user.isProfilePublic,
        timezone: user.timezone,
      },
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
        notificationEmail: true,
        isProfilePublic: true,
        timezone: true,
      },
    })

    return new UserEntity({
      id: createUserId(updatedUser.id),
      name: updatedUser.name,
      role: updatedUser.role,
      status: updatedUser.status,
      notificationEmail: updatedUser.notificationEmail,
      isProfilePublic: updatedUser.isProfilePublic,
      timezone: updatedUser.timezone,
    })
  }

  async deactivateUser(userId: UserId): Promise<void> {
    await this.connection.mUser.update({
      where: {
        id: userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'INACTIVE',
      },
    })
  }

  async activateUser(userId: UserId): Promise<void> {
    await this.connection.mUser.update({
      where: {
        id: userId,
        status: 'INACTIVE',
      },
      data: {
        status: 'ACTIVE',
      },
    })
  }

  async createGuestUser(
    user: UserEntity,
    authProvider: AuthProviderEntity
  ): Promise<UserEntity> {
    const createdUser = await this.connection.mUser.create({
      data: {
        name: user.name,
        status: 'ACTIVE',
        role: 'GUEST',
        isProfilePublic: user.isProfilePublic,
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
        notificationEmail: true,
        isProfilePublic: true,
        timezone: true,
      },
    })

    return new UserEntity({
      id: createUserId(createdUser.id),
      name: createdUser.name,
      role: createdUser.role,
      status: createdUser.status,
      notificationEmail: createdUser.notificationEmail,
      isProfilePublic: createdUser.isProfilePublic,
      timezone: createdUser.timezone,
    })
  }
}
