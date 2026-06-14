import { Prisma } from '@repo/database'
import type { UserId } from '@repo/shared-types'
import { getCurrentDate } from '../../../utils/dateUtils'
import type {
  CreateNotificationInput,
  INotificationRepository,
  NotificationRecord,
} from '../interfaces/INotificationRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaNotificationRepository
  extends PrismaRepositoryBase
  implements INotificationRepository
{
  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const record = await this.connection.tNotification.create({
      data: {
        userId: input.userId,
        type: input.type as never,
        title: input.title,
        body: input.body,
        metadata: (input.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    })
    return this._toRecord(record)
  }

  async findByUserId(
    userId: UserId,
    page: number,
    pageSize: number
  ): Promise<{ notifications: NotificationRecord[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.connection.tNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.connection.tNotification.count({ where: { userId } }),
    ])
    return { notifications: rows.map(this._toRecord), total }
  }

  async countUnread(userId: UserId): Promise<number> {
    return this.connection.tNotification.count({
      where: { userId, isRead: false },
    })
  }

  async markAsRead(id: string, userId: UserId): Promise<void> {
    await this.connection.tNotification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: getCurrentDate() },
    })
  }

  async markAllAsRead(userId: UserId): Promise<void> {
    await this.connection.tNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: getCurrentDate() },
    })
  }

  private _toRecord(
    row: Awaited<
      ReturnType<typeof this.connection.tNotification.findFirstOrThrow>
    >
  ): NotificationRecord {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body,
      metadata:
        row.metadata != null ? (row.metadata as Record<string, unknown>) : null,
      isRead: row.isRead,
      readAt: row.readAt,
      createdAt: row.createdAt,
    }
  }
}
