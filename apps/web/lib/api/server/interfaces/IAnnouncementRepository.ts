import type { UserId } from '@repo/shared-types'

export type AnnouncementRecord = {
  id: string
  type: string
  title: string
  body: string
  status: string
  scheduledAt: Date | null
  publishedAt: Date | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type AnnouncementWithReadStatus = AnnouncementRecord & {
  isRead: boolean
}

export type AnnouncementWithReadCount = AnnouncementRecord & {
  readCount: number
}

export type CreateAnnouncementInput = {
  type: string
  title: string
  body: string
  scheduledAt?: Date | null
  createdBy: UserId
}

export interface IAnnouncementRepository {
  create(input: CreateAnnouncementInput): Promise<AnnouncementRecord>
  findPublished(userId: UserId): Promise<AnnouncementWithReadStatus[]>
  findAll(): Promise<AnnouncementWithReadCount[]>
  findById(id: string): Promise<AnnouncementWithReadCount | null>
  publish(id: string): Promise<AnnouncementRecord>
  expire(id: string): Promise<AnnouncementRecord>
  markAsRead(announcementId: string, userId: UserId): Promise<void>
  countUnreadByUserId(userId: UserId): Promise<number>
}
