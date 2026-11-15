import { NotificationEmailVerificationId, UserId } from '@repo/shared-types'
import { NotificationEmailVerificationEntity } from '../entities/NotificationEmailVerificationEntity'

export interface INotificationEmailVerificationRepository {
  /**
   * 確認トークンを登録する
   */
  create(
    verification: NotificationEmailVerificationEntity
  ): Promise<NotificationEmailVerificationEntity>

  /**
   * 確認トークンのハッシュから取得する
   */
  findByTokenHash(
    tokenHash: string
  ): Promise<NotificationEmailVerificationEntity | null>

  /**
   * 指定時刻時点で確認に使える最新のトークンを取得する（確認待ちアドレスの表示用）
   */
  findLatestUsableByUserId(
    userId: UserId,
    now: Date
  ): Promise<NotificationEmailVerificationEntity | null>

  /**
   * 指定日時以降に発行した件数を数える（送信レート制限の判定用）
   */
  countCreatedSince(userId: UserId, since: Date): Promise<number>

  /**
   * ユーザーの未確認・未無効化のトークンをすべて無効化する
   */
  revokePendingByUserId(userId: UserId, now: Date): Promise<void>

  /**
   * トークンを確認済みにする
   *
   * @returns 確認済みにできた場合は true（既に確認済み・無効化済みの場合は false）
   */
  markVerified(id: NotificationEmailVerificationId, now: Date): Promise<boolean>
}
