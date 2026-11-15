import type { EmailMessage, WelcomeEmailPayload } from '../domain/email'
import { escapeHtml } from '../utils/escapeHtml'
import {
  APP_BASE_URL,
  emailNumberedList,
  emailParagraph,
  renderEmailLayout,
} from './layout/emailLayout'

/**
 * 新規登録時のウェルカムメール
 */
export class WelcomeEmail {
  constructor(private readonly payload: WelcomeEmailPayload) {}

  build(): EmailMessage {
    return {
      to: this.payload.to,
      subject: 'MotoRecoへようこそ',
      html: renderEmailLayout({
        preheader: 'ご登録ありがとうございます。愛車の記録をはじめましょう。',
        heading: 'MotoRecoへようこそ',
        bodyHtml: [
          emailParagraph(
            `${escapeHtml(this.payload.userName)} さん、ご登録ありがとうございます。`
          ),
          emailParagraph(
            '給油・ツーリング・メンテナンスの記録を一冊の整備手帳のようにまとめられます。まずは愛車の登録からはじめてみてください。'
          ),
          emailNumberedList([
            {
              title: '愛車を登録する',
              description:
                '車種と走行距離を入れるだけ。複数台の管理もできます。',
            },
            {
              title: '給油を記録する',
              description: '給油量と走行距離から燃費を自動で計算します。',
            },
            {
              title: 'ツーリングを残す',
              description: '立ち寄った地点や道のりを地図とともに振り返れます。',
            },
            {
              title: 'メンテナンスを積み重ねる',
              description: '作業内容と費用を残し、次の整備時期を把握できます。',
            },
          ]),
        ].join(''),
        action: {
          label: 'MotoRecoをはじめる',
          url: `${APP_BASE_URL}/app/login`,
        },
      }),
    }
  }
}
