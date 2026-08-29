import { ApiV1Error } from '@repo/shared-domain'
import type {
  CreateAnnouncementInput,
  IAnnouncementRepository,
} from '@repo/shared-domain'
import type {
  AnnouncementStatus,
  AnnouncementType,
  UserId,
} from '@repo/shared-types'

export type PublishedReleaseNote = {
  announcementId: string
  version: string
  title: string
  body: string
  publishedAt: string
}

export class AnnouncementService {
  constructor(
    private readonly _announcementRepository: IAnnouncementRepository
  ) {}

  async createAnnouncement(
    input: Omit<CreateAnnouncementInput, 'createdBy'>,
    adminUserId: UserId
  ): Promise<{ announcementId: string }> {
    const record = await this._announcementRepository.create({
      ...input,
      createdBy: adminUserId,
    })
    return { announcementId: record.id }
  }

  async publishAnnouncement(id: string): Promise<void> {
    const record = await this._announcementRepository.findById(id)
    if (!record) {
      throw new ApiV1Error('NOT_FOUND', 'アナウンスが見つかりません')
    }
    if (record.status !== 'DRAFT') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'DRAFTのアナウンスのみ公開できます'
      )
    }
    await this._announcementRepository.publish(id)
  }

  async expireAnnouncement(id: string): Promise<void> {
    const record = await this._announcementRepository.findById(id)
    if (!record) {
      throw new ApiV1Error('NOT_FOUND', 'アナウンスが見つかりません')
    }
    if (record.status !== 'PUBLISHED') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'PUBLISHEDのアナウンスのみ失効できます'
      )
    }
    await this._announcementRepository.expire(id)
  }

  async getPublishedAnnouncements(userId: UserId): Promise<
    {
      announcementId: string
      type: AnnouncementType
      title: string
      body: string
      version: string | null
      publishedAt: string
      isRead: boolean
    }[]
  > {
    const rows = await this._announcementRepository.findPublished(userId)
    return rows.map((r) => ({
      announcementId: r.id,
      type: r.type as AnnouncementType,
      title: r.title,
      body: r.body,
      version: r.version,
      publishedAt: r.publishedAt!.toISOString(),
      isRead: r.isRead,
    }))
  }

  async getPublishedReleaseNotes(): Promise<PublishedReleaseNote[]> {
    const rows = await this._announcementRepository.findPublishedByType(
      'RELEASE_ANNOUNCEMENT'
    )
    return rows.map((r) => ({
      announcementId: r.id,
      version: r.version!,
      title: r.title,
      body: r.body,
      publishedAt: r.publishedAt!.toISOString(),
    }))
  }

  async getAllAnnouncements(): Promise<
    {
      announcementId: string
      type: AnnouncementType
      title: string
      body: string
      version: string | null
      status: AnnouncementStatus
      scheduledAt: string | null
      publishedAt: string | null
      readCount: number
      createdAt: string
      updatedAt: string
    }[]
  > {
    const rows = await this._announcementRepository.findAll()
    return rows.map(this._toAdminItem)
  }

  async getAnnouncementDetail(id: string): Promise<{
    announcementId: string
    type: AnnouncementType
    title: string
    body: string
    version: string | null
    status: AnnouncementStatus
    scheduledAt: string | null
    publishedAt: string | null
    readCount: number
    createdAt: string
    updatedAt: string
  }> {
    const record = await this._announcementRepository.findById(id)
    if (!record) {
      throw new ApiV1Error('NOT_FOUND', 'アナウンスが見つかりません')
    }
    return this._toAdminItem(record)
  }

  async markAsRead(announcementId: string, userId: UserId): Promise<void> {
    const record = await this._announcementRepository.findById(announcementId)
    if (!record || record.status !== 'PUBLISHED') {
      throw new ApiV1Error('NOT_FOUND', 'アナウンスが見つかりません')
    }
    await this._announcementRepository.markAsRead(announcementId, userId)
  }

  async markAllAsRead(userId: UserId): Promise<void> {
    await this._announcementRepository.markAllAsRead(userId)
  }

  async countUnread(userId: UserId): Promise<number> {
    return this._announcementRepository.countUnreadByUserId(userId)
  }

  private _toAdminItem(row: {
    id: string
    type: string
    title: string
    body: string
    version: string | null
    status: string
    scheduledAt: Date | null
    publishedAt: Date | null
    readCount: number
    createdAt: Date
    updatedAt: Date
  }): {
    announcementId: string
    type: AnnouncementType
    title: string
    body: string
    version: string | null
    status: AnnouncementStatus
    scheduledAt: string | null
    publishedAt: string | null
    readCount: number
    createdAt: string
    updatedAt: string
  } {
    return {
      announcementId: row.id,
      type: row.type as AnnouncementType,
      title: row.title,
      body: row.body,
      version: row.version,
      status: row.status as AnnouncementStatus,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      readCount: row.readCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
