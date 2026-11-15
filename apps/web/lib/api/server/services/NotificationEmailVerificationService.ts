import { createHash, randomBytes } from 'crypto'
import {
  ApiV1Error,
  INotificationEmailVerificationRepository,
  IUserRepository,
  NotificationEmailVerificationEntity,
} from '@repo/shared-domain'
import {
  createNotificationEmailVerificationId,
  type UserId,
} from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'

/** 確認トークンの有効期限（ミリ秒） */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

/**
 * 確認メールの送信レート制限
 *
 * @remarks
 * 公式ドメインから任意のアドレスへ大量送信されることを防ぐため、
 * 1ユーザーあたりの発行件数を期間ごとに制限する。
 */
export const NOTIFICATION_EMAIL_VERIFICATION_RATE_LIMITS = [
  { windowMs: 60 * 60 * 1000, max: 3 },
  { windowMs: 24 * 60 * 60 * 1000, max: 10 },
] as const

const INVALID_TOKEN_MESSAGE =
  '確認リンクが無効か、有効期限が切れています。もう一度メールアドレスを設定してください'

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

/**
 * 通知メールアドレスの所有確認を扱うサービス
 *
 * @remarks
 * 通知メールアドレスの変更は即時に反映せず、新しいアドレスへ確認メールを送り、
 * 確認リンクのトークンが検証できた時点で `MUser.notificationEmail` を確定する。
 */
export class NotificationEmailVerificationService {
  constructor(
    private readonly _verificationRepository: INotificationEmailVerificationRepository,
    private readonly _userRepository: IUserRepository
  ) {}

  /**
   * 通知メールアドレスの変更を受け付け、確認トークンを発行する
   *
   * @remarks
   * 同じユーザーの確認待ちトークンは無効化する（最新の依頼のみ有効）。
   * 平文トークンは戻り値として確認メールに埋め込むためだけに返し、DBにはハッシュのみ保存する。
   *
   * @throws {ApiV1Error} TOO_MANY_REQUESTS 送信レート制限を超えた場合
   */
  public async requestChange(
    userId: UserId,
    email: string
  ): Promise<{ token: string; email: string }> {
    const now = getCurrentDate()

    for (const limit of NOTIFICATION_EMAIL_VERIFICATION_RATE_LIMITS) {
      const count = await this._verificationRepository.countCreatedSince(
        userId,
        new Date(now.getTime() - limit.windowMs)
      )
      if (count >= limit.max) {
        throw new ApiV1Error(
          'TOO_MANY_REQUESTS',
          '確認メールの送信回数が上限に達しました。しばらく時間をおいてからお試しください'
        )
      }
    }

    await this._verificationRepository.revokePendingByUserId(userId, now)

    const token = randomBytes(32).toString('base64url')
    await this._verificationRepository.create(
      new NotificationEmailVerificationEntity({
        id: createNotificationEmailVerificationId(''),
        userId,
        email,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
        verifiedAt: null,
        revokedAt: null,
        createdAt: now,
      })
    )

    return { token, email }
  }

  /**
   * 確認待ちの依頼をすべて取り消す（通知メールアドレスの解除・元のアドレスへの戻し時）
   */
  public async cancelPending(userId: UserId): Promise<void> {
    await this._verificationRepository.revokePendingByUserId(
      userId,
      getCurrentDate()
    )
  }

  /**
   * 確認待ちの通知メールアドレスを取得する
   */
  public async getPendingEmail(userId: UserId): Promise<string | null> {
    const pending = await this._verificationRepository.findLatestUsableByUserId(
      userId,
      getCurrentDate()
    )
    return pending?.email ?? null
  }

  /**
   * 確認トークンを検証し、通知メールアドレスを確定する
   *
   * @remarks
   * Firebase認証は不要。トークンのみで完結する公開エンドポイントから呼ばれる。
   * ワンタイム利用（確認済みにした時点で再利用不可）。
   */
  public async verify(token: string): Promise<{ notificationEmail: string }> {
    const now = getCurrentDate()
    const verification = await this._verificationRepository.findByTokenHash(
      hashToken(token)
    )

    if (!verification || !verification.isUsableAt(now)) {
      throw new ApiV1Error('INVALID_REQUEST', INVALID_TOKEN_MESSAGE)
    }

    const user = await this._userRepository.findById(verification.userId)
    if (!user) {
      throw new ApiV1Error('INVALID_REQUEST', INVALID_TOKEN_MESSAGE)
    }

    const marked = await this._verificationRepository.markVerified(
      verification.id,
      now
    )
    if (!marked) {
      throw new ApiV1Error('INVALID_REQUEST', INVALID_TOKEN_MESSAGE)
    }

    user.notificationEmail = verification.email
    await this._userRepository.updateUser(user)

    return { notificationEmail: verification.email }
  }
}
