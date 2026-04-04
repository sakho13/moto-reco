import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `このアプリについて`,
  description: `${APP_NAME} は、バイクのメンテナンス管理を簡単に行うためのアプリです。バイク登録・給油記録・メンテナンス履歴の機能を紹介します。`,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: `${SITE_URL}/about`,
    title: `このアプリについて | ${APP_NAME}`,
    description: `${APP_NAME} は、バイクのメンテナンス管理を簡単に行うためのアプリです。バイク登録・給油記録・メンテナンス履歴の機能を紹介します。`,
    siteName: APP_NAME,
    images: ['/top_image_1.png'],
  },
  twitter: {
    title: `このアプリについて | ${APP_NAME}`,
    description: `${APP_NAME} は、バイクのメンテナンス管理を簡単に行うためのアプリです。`,
    images: ['/top_image_1.png'],
  },
}

const features = [
  {
    title: 'バイク管理',
    description:
      'メーカー・モデル・年式・走行距離などの基本情報を登録。複数台のバイクを一覧で切り替えて管理できます。',
  },
  {
    title: '給油・燃費記録',
    description:
      '給油日、給油量、走行距離をワンステップで記録。燃費の推移をグラフで確認できます。',
  },
  {
    title: 'メンテナンス履歴',
    description:
      '作業内容・費用・メモを保存し、次回メンテナンスのリマインドを設定できます。履歴は共有にも活用できます。',
  },
]

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>このアプリについて</h1>
        <p className={styles.description}>
          {APP_NAME} は、バイクのメンテナンス管理を簡単に行うためのアプリです。
        </p>
      </header>

      <section className={styles.missionSection}>
        <h2 className={styles.sectionTitle}>ミッション</h2>
        <p className={styles.missionText}>
          バイクに乗る時間をもっと楽しく。{APP_NAME}{' '}
          は、記録の手間を最小化し、メンテナンスの見通しを立てやすくすることで、ライダーが走ることに集中できる環境を目指しています。
        </p>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>できること</h2>
          <p className={styles.sectionDescription}>
            日々のバイクライフを支える主要機能を紹介します。
          </p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <p className={styles.ctaText}>まずは無料で試してみましょう。</p>
        <Link
          className={styles.ctaButton}
          href="/app/login"
          target="_blank"
          rel="noreferrer"
        >
          ログインして使ってみる
        </Link>
      </section>
    </div>
  )
}
