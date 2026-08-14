import type { EmailMessage, UserQuitEmailPayload } from '../domain/email'

/**
 * 退会完了メール
 *
 * @remarks
 * 復帰用URL（トークン付き）を本文に埋め込む。トークンは平文のままこのメールにのみ含まれ、
 * DBにはSHA-256ハッシュのみ保存される。
 */
export class UserQuitEmail {
  constructor(private readonly _payload: UserQuitEmailPayload) {}

  build(): EmailMessage {
    const recoverUrl = `https://moto-reco.com/app/recover?token=${this._payload.recoveryToken}`

    return {
      to: this._payload.to,
      subject: 'MotoReco 退会手続きが完了しました',
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 16px; color: #1f2937;">${this._payload.userName}さん、退会手続きが完了しました</h2>
        <p>MotoRecoの退会手続きが完了しました。ご利用ありがとうございました。</p>
        <p>退会日から30日間は下記のボタンからアカウントを復帰できます。30日を経過すると、アカウント情報は完全に削除され復帰できなくなりますのでご注意ください。</p>
        <div style="margin-top: 24px;">
          <a href="${recoverUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            アカウントを復帰する
          </a>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
          このメールに心当たりがない場合は、第三者による誤操作の可能性があります。復帰を行わなければアカウントは自動的に削除されます。
        </p>
      </div>
      `.trim(),
    }
  }
}
