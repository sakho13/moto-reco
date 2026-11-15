import type { EmailMessage, UserQuitEmailPayload } from '../domain/email'
import { escapeHtml } from '../utils/escapeHtml'
import {
  APP_BASE_URL,
  emailCallout,
  emailParagraph,
  renderEmailLayout,
} from './layout/emailLayout'

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
    const recoverUrl = `${APP_BASE_URL}/app/recover?token=${encodeURIComponent(this._payload.recoveryToken)}`

    return {
      to: this._payload.to,
      subject: 'MotoReco 退会手続きが完了しました',
      html: renderEmailLayout({
        preheader: '退会日から30日間はアカウントを復帰できます。',
        heading: '退会手続きが完了しました',
        bodyHtml: [
          emailParagraph(
            `${escapeHtml(this._payload.userName)} さん、これまでMotoRecoをご利用いただきありがとうございました。`
          ),
          emailCallout(
            '退会日から30日間は復帰できます',
            '30日を過ぎるとアカウントと記録はすべて削除され、復帰できなくなります。続けてご利用になる場合は、下のボタンから復帰してください。'
          ),
        ].join(''),
        action: { label: 'アカウントを復帰する', url: recoverUrl },
        footnote:
          'このメールに心当たりがない場合は、第三者による誤操作の可能性があります。復帰を行わなければアカウントは自動的に削除されます。',
      }),
    }
  }
}
