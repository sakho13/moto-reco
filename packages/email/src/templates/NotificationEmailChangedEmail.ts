import type {
  EmailMessage,
  NotificationEmailChangedEmailPayload,
} from '../domain/email'

export class NotificationEmailChangedEmail {
  constructor(
    private readonly _payload: NotificationEmailChangedEmailPayload
  ) {}

  build(): EmailMessage {
    return {
      to: this._payload.to,
      subject: 'MotoRecoの通知メールアドレスが設定されました',
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 16px; color: #1f2937;">${this._payload.userName}さん、通知メールアドレスが設定されました</h2>
        <p>このメールアドレス（<strong>${this._payload.to}</strong>）がMotoRecoの通知メールアドレスとして設定されました。</p>
        <p>今後、MotoRecoからの通知はこのアドレスに送信されます。</p>
        <p>このメールに心当たりがない場合は、MotoRecoアプリの設定からご確認ください。</p>
      </div>
      `.trim(),
    }
  }
}
