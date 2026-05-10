import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { APP_NAME, APP_VERSION, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `バイクメンテナンス・給油記録管理アプリ`,
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
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
}

const features = [
  {
    title: 'バイク登録とガレージ管理',
    description:
      'メーカー・モデル・年式などの基本情報と走行距離をまとめて記録。複数台のバイクも一画面で把握できます。',
    image: '/images/featureGarage.svg',
    anchor: 'feature-garage',
  },
  {
    title: '給油・燃費の記録',
    description:
      '給油日や走行距離、給油量をワンステップで保存。燃費の推移をグラフで確認できます。',
    image: '/images/featureFuel.svg',
    anchor: 'feature-fuel',
  },
  {
    title: 'メンテナンス履歴と通知',
    description:
      '作業内容・費用・メモ・写真を記録し、次回の交換時期をリマインド。履歴は共有にも活用できます。',
    image: '/images/featureMaintenance.svg',
    anchor: 'feature-maintenance',
  },
  {
    title: '公開プロフィール・フレンド機能',
    description:
      'プロフィールを公開してバイク仲間と繋がれます。気になるライダーをフォローして、愛車や走行履歴を確認しましょう。',
    image: '/images/featureFriend.svg',
    anchor: 'feature-friend',
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
              {APP_NAME}
              は、バイクのメンテナンス履歴・給油記録・スケジュールを一元管理するためのアプリです。
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
          <Carousel
            opts={{ align: 'start', loop: true }}
            className={styles.carousel}
          >
            <CarouselContent className={styles.carouselContent}>
              {features.map((feature) => (
                <CarouselItem
                  key={feature.title}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <div className={styles.carouselItemInner}>
                    <Link
                      href={`/about#${feature.anchor}`}
                      className={styles.cardLink}
                    >
                      <article className={styles.card}>
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
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className={styles.carouselPrevious} />
            <CarouselNext className={styles.carouselNext} />
          </Carousel>
        </section>

        <div className={styles.loginCard}>
          <div>
            <p className={styles.badge}>安全運転のために</p>
            <h2 className={styles.loginCardTitle}>原付免許試験の練習</h2>
            <p>
              原付免許の取得を目指す方向けに、学科試験の○×問題を練習できます。
            </p>
          </div>
          <Link href="/moped-test" className={styles.loginCardButton}>
            練習を始める
          </Link>
        </div>
      </div>
    </>
  )
}
