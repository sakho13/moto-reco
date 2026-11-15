import { UserId } from './user'

export type NotificationEmailVerificationId = string & {
  readonly brand: unique symbol
}
export const createNotificationEmailVerificationId = (
  id: string
): NotificationEmailVerificationId => id as NotificationEmailVerificationId

/**
 * 通知メールアドレス変更時の所有確認トークン
 */
export type NotificationEmailVerification = {
  id: NotificationEmailVerificationId
  userId: UserId
  /** 確認待ちの通知メールアドレス */
  email: string
  /** 確認トークンのSHA-256ハッシュ（平文トークンは確認メールにのみ埋め込みDBには保存しない） */
  tokenHash: string
  expiresAt: Date
  verifiedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}
