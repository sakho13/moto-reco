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
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/about',
  },
}

const featureDetails = [
  {
    id: 'feature-garage',
    title: 'バイク登録とガレージ管理',
    items: [
      'メーカー・モデル・年式・走行距離などの基本情報を保存',
      '複数台のバイクを切り替えて管理',
      '共有用のメンテナンス履歴としても活用',
    ],
  },
  {
    id: 'feature-fuel',
    title: '給油・燃費の記録',
    items: [
      '給油日、走行距離、給油量、燃費をまとめて記録',
      '燃費の推移をグラフで確認',
      'オフライン時も記録して後で同期',
    ],
  },
  {
    id: 'feature-maintenance',
    title: 'メンテナンス履歴と通知',
    items: [
      '作業内容、日付、費用、メモ、写真を保存',
      '次回メンテナンスの予定を登録して通知',
      '部品・工具情報へのリンクで準備を効率化',
    ],
  },
  {
    id: 'feature-friend',
    title: '公開プロフィール・フレンド機能',
    items: [
      'プロフィールを公開してユーザー検索で見つけてもらう',
      '気になるライダーをフォローしてバイク・履歴を確認',
      'フォロワー・フォロー中の一覧をプロフィールページで管理',
    ],
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
          <h2 className={styles.sectionTitle}>機能詳細</h2>
          <p className={styles.sectionDescription}>
            各機能の操作の流れと記録できる情報を紹介します。
          </p>
        </div>
        <div className={styles.featureDetailGrid}>
          {featureDetails.map((feature) => (
            <div
              key={feature.id}
              id={feature.id}
              className={styles.featureDetail}
            >
              <h3 className={styles.featureDetailTitle}>{feature.title}</h3>
              <ul className={styles.featureDetailItems}>
                {feature.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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
