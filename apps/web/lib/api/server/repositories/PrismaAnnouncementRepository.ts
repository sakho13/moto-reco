import type { UserId } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import type {
  AnnouncementRecord,
  AnnouncementWithReadCount,
  AnnouncementWithReadStatus,
  CreateAnnouncementInput,
  IAnnouncementRepository,
} from '../interfaces/IAnnouncementRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaAnnouncementRepository
  extends PrismaRepositoryBase
  implements IAnnouncementRepository
{
  async create(input: CreateAnnouncementInput): Promise<AnnouncementRecord> {
    const record = await this.connection.mSystemAnnouncement.create({
      data: {
        type: input.type as never,
        title: input.title,
        body: input.body,
        version: input.version ?? null,
        scheduledAt: input.scheduledAt ?? null,
        createdBy: input.createdBy,
      },
    })
    return this._toRecord(record)
  }

  async findPublished(userId: UserId): Promise<AnnouncementWithReadStatus[]> {
    const rows = await this.connection.mSystemAnnouncement.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: {
        reads: { where: { userId } },
      },
    })
    return rows.map((row) => ({
      ...this._toRecord(row),
      isRead: row.reads.length > 0,
    }))
  }

  async findPublishedByType(type: string): Promise<AnnouncementRecord[]> {
    const rows = await this.connection.mSystemAnnouncement.findMany({
      where: { status: 'PUBLISHED', type: type as never },
      orderBy: { publishedAt: 'desc' },
    })
    return rows.map((row) => this._toRecord(row))
  }

  async findAll(): Promise<AnnouncementWithReadCount[]> {
    const rows = await this.connection.mSystemAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { reads: true } } },
    })
    return rows.map((row) => ({
      ...this._toRecord(row),
      readCount: row._count.reads,
    }))
  }

  async findById(id: string): Promise<AnnouncementWithReadCount | null> {
    const row = await this.connection.mSystemAnnouncement.findUnique({
      where: { id },
      include: { _count: { select: { reads: true } } },
    })
    if (!row) return null
    return { ...this._toRecord(row), readCount: row._count.reads }
  }

  async publish(id: string): Promise<AnnouncementRecord> {
    const record = await this.connection.mSystemAnnouncement.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: getCurrentDate() },
    })
    return this._toRecord(record)
  }

  async expire(id: string): Promise<AnnouncementRecord> {
    const record = await this.connection.mSystemAnnouncement.update({
      where: { id },
      data: { status: 'EXPIRED' },
    })
    return this._toRecord(record)
  }

  async markAsRead(announcementId: string, userId: UserId): Promise<void> {
    await this.connection.tSystemAnnouncementRead.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      create: { announcementId, userId },
      update: {},
    })
  }

  async markAllAsRead(userId: UserId): Promise<void> {
    const published = await this.connection.mSystemAnnouncement.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true },
    })
    await this.connection.tSystemAnnouncementRead.createMany({
      data: published.map((a) => ({ announcementId: a.id, userId })),
      skipDuplicates: true,
    })
  }

  async countUnreadByUserId(userId: UserId): Promise<number> {
    const [total, readCount] = await Promise.all([
      this.connection.mSystemAnnouncement.count({
        where: { status: 'PUBLISHED' },
      }),
      this.connection.tSystemAnnouncementRead.count({
        where: {
          userId,
          announcement: { status: 'PUBLISHED' },
        },
      }),
    ])
    return Math.max(0, total - readCount)
  }

  private _toRecord(
    row: Awaited<
      ReturnType<typeof this.connection.mSystemAnnouncement.findFirstOrThrow>
    >
  ): AnnouncementRecord {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      version: row.version,
      status: row.status,
      scheduledAt: row.scheduledAt,
      publishedAt: row.publishedAt,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
