import { PrismaClient } from '@repo/database'
import { createUserId, type UserId } from '@repo/shared-types'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'
import { IUserRepository } from '../interfaces/IUserRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

/** planHistories を含む select の共通定義 */
const USER_SELECT = {
  id: true,
  name: true,
  status: true,
  role: true,
  notificationEmail: true,
  isProfilePublic: true,
  planHistories: {
    orderBy: { changedAt: 'desc' as const },
    take: 1,
    select: { plan: true },
  },
} as const

function toUserEntity(user: {
  id: string
  name: string
  status: string
  role: string
  notificationEmail: string | null
  isProfilePublic: boolean
  planHistories: { plan: string }[]
}): UserEntity {
  const plan =
    (user.planHistories[0]?.plan as 'FREE' | 'PREMIUM' | undefined) ?? null
  return new UserEntity(
    {
      id: createUserId(user.id),
      name: user.name,
      role: user.role as 'USER' | 'ADMIN' | 'GUEST',
      status: user.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      notificationEmail: user.notificationEmail,
      isProfilePublic: user.isProfilePublic,
    },
    plan
  )
}

export class PrismaUserRepository
  extends PrismaRepositoryBase
  implements IUserRepository
{
  async findById(userId: UserId): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: USER_SELECT,
      where: { id: userId, status: 'ACTIVE' },
    })
    return user ? toUserEntity(user) : null
  }

  async findByIdIncludingInactive(userId: UserId): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: USER_SELECT,
      where: { id: userId },
    })
    return user ? toUserEntity(user) : null
  }

  async findByAuthProvider(
    authProvider: AuthProviderEntity
  ): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: USER_SELECT,
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
    return user ? toUserEntity(user) : null
  }

  async createUser(
    user: UserEntity,
    authProvider: AuthProviderEntity
  ): Promise<UserEntity> {
    const client = this.connection as PrismaClient

    return client.$transaction(async (tx) => {
      const createdUser = await tx.mUser.create({
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
        select: { id: true },
      })

      // USER ロールの初回プランを FREE として登録
      await tx.tUserPlanHistory.create({
        data: {
          userId: createdUser.id,
          plan: 'FREE',
          changedById: createdUser.id,
        },
      })

      const result = await tx.mUser.findFirstOrThrow({
        select: USER_SELECT,
        where: { id: createdUser.id },
      })
      return toUserEntity(result)
    })
  }

  async updateUser(user: UserEntity): Promise<UserEntity> {
    const updatedUser = await this.connection.mUser.update({
      where: { id: user.id, status: 'ACTIVE' },
      data: {
        name: user.name,
        notificationEmail: user.notificationEmail,
        isProfilePublic: user.isProfilePublic,
      },
      select: USER_SELECT,
    })
    return toUserEntity(updatedUser)
  }

  async deactivateUser(userId: UserId): Promise<void> {
    await this.connection.mUser.update({
      where: { id: userId, status: 'ACTIVE' },
      data: { status: 'INACTIVE' },
    })
  }

  async activateUser(userId: UserId): Promise<void> {
    await this.connection.mUser.update({
      where: { id: userId, status: 'INACTIVE' },
      data: { status: 'ACTIVE' },
    })
  }

  async createGuestUser(
    user: UserEntity,
    authProvider: AuthProviderEntity
  ): Promise<UserEntity> {
    // GUEST ロールはプラン管理の対象外のため TUserPlanHistory は作成しない
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
      select: USER_SELECT,
    })
    return toUserEntity(createdUser)
  }
}
