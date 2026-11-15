import type {
  EmailMessage,
  NotificationEmailVerificationEmailPayload,
} from '../domain/email'
import { escapeHtml } from '../utils/escapeHtml'

/** 確認トークンの有効期限（時間）。本文の案内文と揃える */
const EXPIRES_IN_HOURS = 24

/**
 * 通知メールアドレスの所有確認メール
 *
 * @remarks
 * 所有確認前のアドレスに送るため、第三者が任意の文言を届けられないよう
 * 表示名などユーザーが入力した値は本文に含めない。
 * 確認用URL（トークン付き）のみを埋め込む。トークンは平文のままこのメールにのみ含まれ、
 * DBにはSHA-256ハッシュのみ保存される。
 */
export class NotificationEmailVerificationEmail {
  constructor(
    private readonly _payload: NotificationEmailVerificationEmailPayload
  ) {}

  build(): EmailMessage {
    const verifyUrl = `https://moto-reco.com/app/verify-notification-email?token=${encodeURIComponent(this._payload.token)}`

    return {
      to: this._payload.to,
      subject: 'MotoReco 通知メールアドレスの確認',
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 16px; color: #1f2937;">通知メールアドレスの確認</h2>
        <p>MotoRecoで、このメールアドレスを通知メールアドレスに設定する手続きが行われました。</p>
        <p>お手続きを完了するには、${EXPIRES_IN_HOURS}時間以内に下のボタンを押してください。</p>
        <div style="margin-top: 24px;">
          <a href="${escapeHtml(verifyUrl)}"
             style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            メールアドレスを確認する
          </a>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
          このメールに心当たりがない場合は、破棄してください。確認しない限りこのアドレスは設定されません。
        </p>
      </div>
      `.trim(),
    }
  }
}
