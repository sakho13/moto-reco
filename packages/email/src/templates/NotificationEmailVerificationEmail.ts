import type {
  EmailMessage,
  NotificationEmailVerificationEmailPayload,
} from '../domain/email'
import {
  APP_BASE_URL,
  emailCallout,
  emailParagraph,
  renderEmailLayout,
} from './layout/emailLayout'

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
    const verifyUrl = `${APP_BASE_URL}/app/verify-notification-email?token=${encodeURIComponent(this._payload.token)}`

    return {
      to: this._payload.to,
      subject: 'MotoReco 通知メールアドレスの確認',
      html: renderEmailLayout({
        preheader: `${EXPIRES_IN_HOURS}時間以内にリンクから確認すると設定が完了します。`,
        heading: '通知メールアドレスの確認',
        bodyHtml: [
          emailParagraph(
            'MotoRecoで、このメールアドレスを通知の送り先に設定する手続きが行われました。'
          ),
          emailParagraph(
            '下のボタンから確認すると設定が完了し、今後のお知らせがこのアドレスに届くようになります。'
          ),
          emailCallout(
            `確認の期限は${EXPIRES_IN_HOURS}時間です`,
            '期限を過ぎた場合は、アプリのプロフィールからもう一度メールアドレスを設定してください。'
          ),
        ].join(''),
        action: { label: 'メールアドレスを確認する', url: verifyUrl },
        footnote:
          'このメールに心当たりがない場合は、破棄してください。確認しない限り、このアドレスが設定されることはありません。',
      }),
    }
  }
}
