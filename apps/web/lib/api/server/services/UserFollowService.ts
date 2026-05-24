import type { UserId } from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import type { INotificationRepository } from '../interfaces/INotificationRepository'
import type { IUserFollowRepository } from '../interfaces/IUserFollowRepository'
import type { IUserRepository } from '../interfaces/IUserRepository'

const PAGE_SIZE = 20

export class UserFollowService {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _followRepository: IUserFollowRepository,
    private readonly _notificationRepository: INotificationRepository
  ) {}

  async followUser(
    followerId: UserId,
    followingId: UserId,
    followerRole: string
  ): Promise<void> {
    if (followerRole === 'GUEST') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'ゲストアカウントはフォローできません'
      )
    }

    if (followerId === followingId) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '自分自身をフォローすることはできません'
      )
    }

    const targetUser = await this._userRepository.findById(followingId)
    if (!targetUser) {
      throw new ApiV1Error('NOT_FOUND', 'ユーザーが見つかりません')
    }
    if (!targetUser.isProfilePublic) {
      throw new ApiV1Error('NOT_FOUND', 'ユーザーが見つかりません')
    }

    const alreadyFollowing = await this._followRepository.isFollowing(
      followerId,
      followingId
    )
    if (alreadyFollowing) {
      return
    }

    const followerUser = await this._userRepository.findById(followerId)

    await this._followRepository.follow(followerId, followingId)

    // フォロー通知を非同期で生成 (メイン処理をブロックしない)
    this._notificationRepository
      .create({
        userId: followingId,
        type: 'FOLLOWED',
        title: 'フォローされました',
        body: `${followerUser?.name ?? 'ユーザー'}さんにフォローされました`,
        metadata: {
          followerId,
          followerName: followerUser?.name ?? '',
        },
      })
      .catch((err) => console.error('[UserFollowService] 通知生成エラー:', err))
  }

  async unfollowUser(followerId: UserId, followingId: UserId): Promise<void> {
    if (followerId === followingId) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '自分自身をフォロー解除することはできません'
      )
    }

    await this._followRepository.unfollow(followerId, followingId)
  }

  async getFollowers(
    userId: UserId,
    page: number
  ): Promise<{
    users: { userId: string; name: string }[]
    total: number
    page: number
  }> {
    const { users, total } = await this._followRepository.findFollowers(
      userId,
      page,
      PAGE_SIZE
    )
    return {
      users: users.map((u) => ({ userId: u.id, name: u.name })),
      total,
      page,
    }
  }

  async getFollowing(
    userId: UserId,
    page: number
  ): Promise<{
    users: { userId: string; name: string }[]
    total: number
    page: number
  }> {
    const { users, total } = await this._followRepository.findFollowing(
      userId,
      page,
      PAGE_SIZE
    )
    return {
      users: users.map((u) => ({ userId: u.id, name: u.name })),
      total,
      page,
    }
  }

  async searchUsers(
    query: string,
    requesterId: UserId,
    page: number
  ): Promise<{
    users: { userId: string; name: string; isFollowing: boolean }[]
    total: number
    page: number
  }> {
    const { users, total } = await this._followRepository.searchUsers(
      query,
      page,
      PAGE_SIZE
    )

    const usersWithFollowStatus = await Promise.all(
      users.map(async (u) => ({
        userId: u.id,
        name: u.name,
        isFollowing: await this._followRepository.isFollowing(
          requesterId,
          u.id as UserId
        ),
      }))
    )

    return { users: usersWithFollowStatus, total, page }
  }
}
