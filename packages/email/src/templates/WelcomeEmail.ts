import type { EmailMessage, WelcomeEmailPayload } from '../domain/email'

export class WelcomeEmail {
  constructor(private readonly payload: WelcomeEmailPayload) {}

  build(): EmailMessage {
    return {
      to: this.payload.to,
      subject: 'MotoRecoへようこそ',
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 16px; color: #1f2937;">${this.payload.userName}さん、MotoRecoへようこそ！</h2>
        <p>MotoRecoにご登録いただきありがとうございます。</p>
        <p>このアプリでは、次のことができます。</p>
        <ul>
          <li>愛車の登録と管理</li>
          <li>給油ログの記録と燃費の可視化</li>
          <li>ツーリング履歴の管理</li>
          <li>メンテナンス履歴の蓄積</li>
        </ul>
        <p>ぜひ日々のバイクライフの記録にご活用ください！</p>
        <div style="margin-top: 24px;">
          <a href="https://moto-reco.com/app/login"
             style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            MotoRecoにログイン
          </a>
        </div>
      </div>
      `.trim(),
    }
  }
}
