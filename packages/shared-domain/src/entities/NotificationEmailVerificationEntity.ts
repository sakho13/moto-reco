import {
  NotificationEmailVerification,
  NotificationEmailVerificationId,
  UserId,
} from '@repo/shared-types'

/**
 * 通知メールアドレスの所有確認トークンのエンティティ
 */
export class NotificationEmailVerificationEntity {
  private _value: NotificationEmailVerification

  constructor(value: NotificationEmailVerification) {
    this._value = value
  }

  public get id(): NotificationEmailVerificationId {
    return this._value.id
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get email(): string {
    return this._value.email
  }

  public get tokenHash(): string {
    return this._value.tokenHash
  }

  public get expiresAt(): Date {
    return this._value.expiresAt
  }

  public get verifiedAt(): Date | null {
    return this._value.verifiedAt
  }

  public get revokedAt(): Date | null {
    return this._value.revokedAt
  }

  public get createdAt(): Date {
    return this._value.createdAt
  }

  /**
   * 指定時刻時点で確認に使えるか（未確認・未無効化・有効期限内）
   */
  public isUsableAt(now: Date): boolean {
    return (
      this._value.verifiedAt === null &&
      this._value.revokedAt === null &&
      this._value.expiresAt.getTime() > now.getTime()
    )
  }

  public toJson(): NotificationEmailVerification {
    return this._value
  }
}
