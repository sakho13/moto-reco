import type { UserId } from '@repo/shared-types'

export type NotificationRecord = {
  id: string
  userId: string
  type: string
  title: string
  body: string
  metadata: Record<string, unknown> | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

export type CreateNotificationInput = {
  userId: UserId
  type: string
  title: string
  body: string
  metadata?: Record<string, unknown>
}

export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<NotificationRecord>
  findByUserId(
    userId: UserId,
    page: number,
    pageSize: number
  ): Promise<{ notifications: NotificationRecord[]; total: number }>
  countUnread(userId: UserId): Promise<number>
  markAsRead(id: string, userId: UserId): Promise<void>
  markAllAsRead(userId: UserId): Promise<void>
}
