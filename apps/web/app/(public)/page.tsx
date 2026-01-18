import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import { APP_NAME, APP_VERSION, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `${APP_NAME} | バイクメンテナンス・給油記録管理アプリ`,
  description:
    'バイクのメンテナンス履歴・給油記録・整備スケジュールを一元管理。走行距離や燃費の推移をグラフで確認でき、次回メンテナンスをリマインド通知。複数台のバイク管理にも対応した無料アプリです。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    title: `${APP_NAME} | バイクメンテナンス・給油記録管理アプリ`,
    description:
      'バイクのメンテナンス履歴・給油記録・整備スケジュールを一元管理。走行距離や燃費の推移をグラフで確認でき、次回メンテナンスをリマインド通知。',
    siteName: APP_NAME,
    images: [
      {
        url: '/top_image_1.png',
        width: 2048,
        height: 2048,
        alt: 'moto-reco - バイクメンテナンス管理アプリ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} | バイクメンテナンス・給油記録管理アプリ`,
    description:
      'バイクのメンテナンス履歴・給油記録・整備スケジュールを一元管理。走行距離や燃費の推移をグラフで確認。',
    images: ['/top_image_1.png'],
  },
}

const features = [
  {
    title: 'バイク登録とガレージ管理',
    description:
      'メーカー・モデル・年式などの基本情報と走行距離をまとめて記録。複数台のバイクも一画面で把握できます。',
    image: '/images/featureGarage.svg',
  },
  {
    title: '給油・燃費の記録',
    description:
      '給油日や走行距離、給油量をワンステップで保存。燃費の推移をグラフで確認できます。',
    image: '/images/featureFuel.svg',
  },
  {
    title: 'メンテナンス履歴と通知',
    description:
      '作業内容・費用・メモ・写真を記録し、次回の交換時期をリマインド。履歴は共有にも活用できます。',
    image: '/images/featureMaintenance.svg',
  },
]

export default function Home() {
  return (
    <>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <p className={styles.badge}>ver {APP_VERSION}</p>
            <h1 className={styles.title}>
              バイクメンテナンスを、もっと分かりやすく
            </h1>
            <p className={styles.lead}>
              moto-recoは、バイクのメンテナンス履歴・給油記録・スケジュールを一元管理するためのアプリです。
              必要な情報をすぐに探せるよう、機能ごとにガイドを整理しています。
            </p>
          </div>
          <div className={styles.ctaGroup}>
            <Link
              className={styles.primaryButton}
              href={`/app/login`}
              target="_blank"
              rel="noreferrer"
            >
              ログインして使ってみる
            </Link>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>主要機能の紹介</h2>
            <p>日々のメンテナンスを支える中核機能をピックアップしています。</p>
          </div>
          <div className={styles.cardGrid}>
            {features.map((feature) => (
              <article key={feature.title} className={styles.card}>
                <Image
                  className={styles.cardImage}
                  src={feature.image}
                  alt={`${feature.title}のスクリーンショット`}
                  width={800}
                  height={480}
                  unoptimized
                />
                <div className={styles.cardBody}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionHeader}>
            <h2>主要機能の詳細</h2>
            <p>具体的な操作の流れと、どの情報を記録できるかを確認できます。</p>
          </div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <h3>バイク登録</h3>
              <ul>
                <li>メーカー・モデル・年式・走行距離などの基本情報を保存</li>
                <li>複数台のバイクを切り替えて管理</li>
                <li>共有用のメンテナンス履歴としても活用</li>
              </ul>
            </div>
            <div className={styles.detailItem}>
              <h3>給油記録</h3>
              <ul>
                <li>給油日、走行距離、給油量、燃費をまとめて記録</li>
                <li>燃費の推移をグラフで確認</li>
                <li>オフライン時も記録して後で同期</li>
              </ul>
            </div>
            <div className={styles.detailItem}>
              <h3>メンテナンス履歴</h3>
              <ul>
                <li>作業内容、日付、費用、メモ、写真を保存</li>
                <li>次回メンテナンスの予定を登録して通知</li>
                <li>部品・工具情報へのリンクで準備を効率化</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
