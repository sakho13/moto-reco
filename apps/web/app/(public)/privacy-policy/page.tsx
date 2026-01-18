import type { Metadata } from 'next'
import styles from './page.module.css'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: `${APP_NAME}のプライバシーポリシーです。取得する情報や利用目的、第三者提供の有無について説明します。`,
  openGraph: {
    url: `${SITE_URL}/privacy-policy`,
    title: `プライバシーポリシー | ${APP_NAME}`,
    description: `${APP_NAME}のプライバシーポリシーです。`,
    images: ['/top_image_1.png'],
  },
  twitter: {
    title: `プライバシーポリシー | ${APP_NAME}`,
    description: `${APP_NAME}のプライバシーポリシーです。`,
    images: ['/top_image_1.png'],
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>プライバシーポリシー</h1>
        <p className={styles.description}>
          {APP_NAME}（以下「本サービス」）は、ユーザーの個人情報を適切に取り扱うことを重要な責務と考え、
          本プライバシーポリシーを定めます。
        </p>
        <p className={styles.note}>最終更新日: 2026年1月</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. 取得する情報</h2>
          <div className={styles.sectionBody}>
            <p>
              本サービスでは、アカウント作成や利用状況の把握のために以下の情報を取得する場合があります。
            </p>
            <ul className={styles.list}>
              <li>氏名、ニックネーム、メールアドレスなど登録時に入力した情報</li>
              <li>バイクの登録情報、給油記録、メンテナンス履歴などサービス利用に伴う情報</li>
              <li>アクセスログ、端末情報、Cookie等の識別子などの技術情報</li>
              <li>お問い合わせ時に提供される情報</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. 利用目的</h2>
          <div className={styles.sectionBody}>
            <p>取得した情報は以下の目的で利用します。</p>
            <ul className={styles.list}>
              <li>アカウントの作成・本人確認・ログイン機能の提供</li>
              <li>バイク管理・記録機能などサービス機能の提供と維持</li>
              <li>サービス品質の改善や利用状況の分析</li>
              <li>不正利用の検知およびセキュリティ対策</li>
              <li>お問い合わせへの対応</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. 第三者提供</h2>
          <p className={styles.sectionBody}>
            取得した情報は、法令に基づく場合やユーザーの同意がある場合を除き、第三者へ提供しません。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. 外部サービスの利用</h2>
          <div className={styles.sectionBody}>
            <p>
              本サービスは、認証・分析・データ保管などの目的で外部サービスを利用する場合があります。
              これらのサービス提供者は、各社のプライバシーポリシーに従って情報を取り扱います。
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. 情報の管理</h2>
          <p className={styles.sectionBody}>
            本サービスは、取得した情報の漏えいや改ざんを防ぐため、アクセス制御や暗号化などの合理的な安全対策を講じます。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. 保管期間</h2>
          <p className={styles.sectionBody}>
            取得した情報は、利用目的の達成に必要な期間保管し、不要となった場合には適切な方法で削除します。
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. ユーザーの権利</h2>
          <div className={styles.sectionBody}>
            <p>
              ユーザーは、自己の情報について開示・訂正・削除等を求めることができます。
              具体的な手続きはサポート窓口までお問い合わせください。
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. ポリシーの変更</h2>
          <p className={styles.sectionBody}>
            本プライバシーポリシーは、法令やサービス内容の変更に応じて改定されることがあります。
            重要な変更がある場合は、本サービス上で告知します。
          </p>
        </section>
      </div>
    </div>
  )
}
