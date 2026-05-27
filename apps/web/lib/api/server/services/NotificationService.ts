import type { NotificationType, UserId } from '@repo/shared-types'
import type { INotificationRepository } from '../interfaces/INotificationRepository'

export class NotificationService {
  constructor(
    private readonly _notificationRepository: INotificationRepository
  ) {}

  async createFollowedNotification(
    followingId: UserId,
    followerId: UserId,
    followerName: string
  ): Promise<void> {
    await this._notificationRepository.create({
      userId: followingId,
      type: 'FOLLOWED',
      title: 'フォローされました',
      body: `${followerName}さんにフォローされました`,
      metadata: { followerId, followerName },
    })
  }

  async getNotifications(
    userId: UserId,
    page: number
  ): Promise<{
    notifications: {
      notificationId: string
      type: NotificationType
      title: string
      body: string
      metadata: Record<string, unknown> | null
      isRead: boolean
      readAt: string | null
      createdAt: string
    }[]
    total: number
    page: number
  }> {
    const PAGE_SIZE = 20
    const { notifications, total } =
      await this._notificationRepository.findByUserId(userId, page, PAGE_SIZE)

    return {
      notifications: notifications.map((n) => ({
        notificationId: n.id,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        metadata: n.metadata,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      page,
    }
  }

  async countUnread(userId: UserId): Promise<number> {
    return this._notificationRepository.countUnread(userId)
  }

  async markAsRead(id: string, userId: UserId): Promise<void> {
    await this._notificationRepository.markAsRead(id, userId)
  }

  async markAllAsRead(userId: UserId): Promise<void> {
    await this._notificationRepository.markAllAsRead(userId)
  }
}
