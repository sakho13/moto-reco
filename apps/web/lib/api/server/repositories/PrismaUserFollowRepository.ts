import { createUserId, type UserId } from '@repo/shared-types'
import { UserEntity } from '../entities/UserEntity'
import { IUserFollowRepository } from '../interfaces/IUserFollowRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const PAGE_SIZE = 20

export class PrismaUserFollowRepository
  extends PrismaRepositoryBase
  implements IUserFollowRepository
{
  async follow(followerId: UserId, followingId: UserId): Promise<void> {
    await this.connection.tUserFollow.create({
      data: {
        followerId,
        followingId,
      },
    })
  }

  async unfollow(followerId: UserId, followingId: UserId): Promise<void> {
    await this.connection.tUserFollow.deleteMany({
      where: { followerId, followingId },
    })
  }

  async isFollowing(followerId: UserId, followingId: UserId): Promise<boolean> {
    const record = await this.connection.tUserFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      select: { id: true },
    })
    return record !== null
  }

  async findFollowers(
    userId: UserId,
    page: number,
    pageSize: number = PAGE_SIZE
  ): Promise<{ users: UserEntity[]; total: number }> {
    const skip = (page - 1) * pageSize

    const [records, total] = await Promise.all([
      this.connection.tUserFollow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          follower: {
            select: {
              id: true,
              name: true,
              status: true,
              role: true,
              notificationEmail: true,
              isProfilePublic: true,
            },
          },
        },
      }),
      this.connection.tUserFollow.count({ where: { followingId: userId } }),
    ])

    const users = records.map(
      (r) =>
        new UserEntity({
          id: createUserId(r.follower.id),
          name: r.follower.name,
          role: r.follower.role,
          status: r.follower.status,
          notificationEmail: r.follower.notificationEmail,
          isProfilePublic: r.follower.isProfilePublic,
        })
    )

    return { users, total }
  }

  async findFollowing(
    userId: UserId,
    page: number,
    pageSize: number = PAGE_SIZE
  ): Promise<{ users: UserEntity[]; total: number }> {
    const skip = (page - 1) * pageSize

    const [records, total] = await Promise.all([
      this.connection.tUserFollow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          following: {
            select: {
              id: true,
              name: true,
              status: true,
              role: true,
              notificationEmail: true,
              isProfilePublic: true,
            },
          },
        },
      }),
      this.connection.tUserFollow.count({ where: { followerId: userId } }),
    ])

    const users = records.map(
      (r) =>
        new UserEntity({
          id: createUserId(r.following.id),
          name: r.following.name,
          role: r.following.role,
          status: r.following.status,
          notificationEmail: r.following.notificationEmail,
          isProfilePublic: r.following.isProfilePublic,
        })
    )

    return { users, total }
  }

  async countFollowers(userId: UserId): Promise<number> {
    return this.connection.tUserFollow.count({ where: { followingId: userId } })
  }

  async countFollowing(userId: UserId): Promise<number> {
    return this.connection.tUserFollow.count({ where: { followerId: userId } })
  }

  async searchUsers(
    query: string,
    page: number,
    pageSize: number = PAGE_SIZE
  ): Promise<{ users: UserEntity[]; total: number }> {
    const skip = (page - 1) * pageSize

    const [records, total] = await Promise.all([
      this.connection.mUser.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          isProfilePublic: true,
          status: 'ACTIVE',
          role: { not: 'GUEST' },
        },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          status: true,
          role: true,
          notificationEmail: true,
          isProfilePublic: true,
        },
      }),
      this.connection.mUser.count({
        where: {
          name: { contains: query, mode: 'insensitive' },
          isProfilePublic: true,
          status: 'ACTIVE',
          role: { not: 'GUEST' },
        },
      }),
    ])

    const users = records.map(
      (u) =>
        new UserEntity({
          id: createUserId(u.id),
          name: u.name,
          role: u.role,
          status: u.status,
          notificationEmail: u.notificationEmail,
          isProfilePublic: u.isProfilePublic,
        })
    )

    return { users, total }
  }
}
