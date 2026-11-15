import {
  INotificationEmailVerificationRepository,
  NotificationEmailVerificationEntity,
} from '@repo/shared-domain'
import {
  createNotificationEmailVerificationId,
  createUserId,
  type NotificationEmailVerificationId,
  type UserId,
} from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const SELECT = {
  id: true,
  userId: true,
  email: true,
  tokenHash: true,
  expiresAt: true,
  verifiedAt: true,
  revokedAt: true,
  createdAt: true,
} as const

type Row = {
  id: string
  userId: string
  email: string
  tokenHash: string
  expiresAt: Date
  verifiedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

const toEntity = (row: Row): NotificationEmailVerificationEntity =>
  new NotificationEmailVerificationEntity({
    id: createNotificationEmailVerificationId(row.id),
    userId: createUserId(row.userId),
    email: row.email,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    verifiedAt: row.verifiedAt,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
  })

export class PrismaNotificationEmailVerificationRepository
  extends PrismaRepositoryBase
  implements INotificationEmailVerificationRepository
{
  async lockByUserId(userId: UserId): Promise<void> {
    // ユーザー行を行ロックし、同じユーザーの発行処理をトランザクション単位で直列化する
    await this.connection
      .$queryRaw`SELECT 1 FROM "MUser" WHERE "id" = ${userId} FOR UPDATE`
  }

  async create(
    verification: NotificationEmailVerificationEntity
  ): Promise<NotificationEmailVerificationEntity> {
    const created =
      await this.connection.tUserNotificationEmailVerification.create({
        data: {
          userId: verification.userId,
          email: verification.email,
          tokenHash: verification.tokenHash,
          expiresAt: verification.expiresAt,
        },
        select: SELECT,
      })
    return toEntity(created)
  }

  async findByTokenHash(
    tokenHash: string
  ): Promise<NotificationEmailVerificationEntity | null> {
    const row =
      await this.connection.tUserNotificationEmailVerification.findUnique({
        where: { tokenHash },
        select: SELECT,
      })
    return row ? toEntity(row) : null
  }

  async findLatestUsableByUserId(
    userId: UserId,
    now: Date
  ): Promise<NotificationEmailVerificationEntity | null> {
    const row =
      await this.connection.tUserNotificationEmailVerification.findFirst({
        where: {
          userId,
          verifiedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
        select: SELECT,
      })
    return row ? toEntity(row) : null
  }

  async countCreatedSince(userId: UserId, since: Date): Promise<number> {
    return this.connection.tUserNotificationEmailVerification.count({
      where: { userId, createdAt: { gte: since } },
    })
  }

  async revokePendingByUserId(userId: UserId, now: Date): Promise<void> {
    await this.connection.tUserNotificationEmailVerification.updateMany({
      where: { userId, verifiedAt: null, revokedAt: null },
      data: { revokedAt: now },
    })
  }

  async markVerified(
    id: NotificationEmailVerificationId,
    now: Date
  ): Promise<boolean> {
    // 同時に確認された場合でも1回だけ成功させるため、未確認・未無効化を条件に更新する
    const result =
      await this.connection.tUserNotificationEmailVerification.updateMany({
        where: { id, verifiedAt: null, revokedAt: null },
        data: { verifiedAt: now },
      })
    return result.count === 1
  }
}
