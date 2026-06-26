import {
  Activity,
  ArrowRight,
  Check,
  Navigation,
  Users,
  Wrench,
} from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
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
    icon: Wrench,
    title: 'メンテナンス管理',
    description:
      '作業内容・費用・写真を記録し、次回の整備タイミングをプッシュ通知でリマインド。整備履歴をいつでも確認できます。',
    image: '/images/featureMaintenance.svg',
    link: '/about#feature-maintenance',
    color: 'orange',
  },
  {
    icon: Activity,
    title: '給油・燃費の記録',
    description:
      '給油日・走行距離・給油量をワンステップで保存。燃費の推移グラフで愛車の状態を把握できます。',
    image: '/images/featureFuel.svg',
    link: '/about#feature-fuel',
    color: 'blue',
  },
  {
    icon: Navigation,
    title: 'ツーリング記録',
    description:
      '走った場所・距離・思い出をログとして保存。ルート記録で過去のツーリングをいつでも振り返れます。',
    image: '/images/featureGarage.svg',
    link: '/about#feature-garage',
    color: 'green',
  },
  {
    icon: Users,
    title: 'ライダーコミュニティ',
    description:
      'プロフィールを公開してバイク仲間と繋がれます。フォローしたライダーの愛車や記録を確認しましょう。',
    image: '/images/featureFriend.svg',
    link: '/about#feature-friend',
    color: 'purple',
  },
] as const

const iconColorClass: Record<string, string> = {
  orange: styles.featureIconOrange,
  blue: styles.featureIconBlue,
  green: styles.featureIconGreen,
  purple: styles.featureIconPurple,
}

const steps = [
  {
    number: '01',
    title: 'アカウントを作成',
    description:
      'メールアドレスで登録するだけ。ゲストアカウントならサインアップ不要で7日間お試しできます。',
  },
  {
    number: '02',
    title: 'バイクを登録する',
    description:
      'メーカー・モデル・年式を入力して、あなたの愛車をガレージに追加しましょう。複数台にも対応。',
  },
  {
    number: '03',
    title: '記録を積み重ねる',
    description:
      '給油するたび、整備するたびに記録。蓄積されたデータがあなたの愛車をしっかり守ります。',
  },
] as const

const freeFeatures = [
  'バイク2台まで登録無料',
  '給油・メンテナンス記録無制限',
  'ツーリングログ',
  'メンテナンス通知',
] as const

export default function Home() {
  return (
    <main>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              ver {APP_VERSION} · 無料で始められます
            </span>
            <h1 className={styles.heroTitle}>
              バイクのメンテナンスを、
              <br />
              <span className={styles.heroAccent}>スマートに管理</span>する
            </h1>
            <p className={styles.heroLead}>
              {APP_NAME}
              は、給油記録・メンテナンス履歴・ツーリングログを一元管理するバイク専用アプリです。
              複数台のバイクもまとめて把握できます。
            </p>
            <div className={styles.heroCtas}>
              <Link
                href="/app/login"
                className={styles.ctaPrimary}
                target="_blank"
                rel="noreferrer"
              >
                無料で始める
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/about" className={styles.ctaGhost}>
                機能を見る
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroImageGrid}>
              {features.map((f) => (
                <div key={f.title} className={styles.heroImageItem}>
                  <Image
                    src={f.image}
                    alt=""
                    width={280}
                    height={180}
                    className={styles.heroImg}
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section
        className={styles.featuresSection}
        aria-labelledby="features-heading"
      >
        <div className={styles.sectionContainer}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>主要機能</span>
            <h2 id="features-heading" className={styles.sectionTitle}>
              愛車の管理に必要な機能が揃っています
            </h2>
            <p className={styles.sectionDesc}>
              日々のメンテナンスを支える4つの中核機能
            </p>
          </header>

          <div className={styles.featuresGrid}>
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.title}
                  href={feature.link}
                  className={styles.featureCard}
                >
                  <div
                    className={`${styles.featureIcon} ${iconColorClass[feature.color] ?? ''}`}
                  >
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDesc}>{feature.description}</p>
                  <span className={styles.featureMore} aria-hidden="true">
                    詳しく見る <ArrowRight size={14} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== Steps ===== */}
      <section className={styles.stepsSection} aria-labelledby="steps-heading">
        <div className={styles.sectionContainer}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>始め方</span>
            <h2 id="steps-heading" className={styles.sectionTitle}>
              3ステップで使い始められます
            </h2>
          </header>

          <ol className={styles.stepsGrid}>
            {steps.map((step) => (
              <li key={step.number} className={styles.step}>
                <div className={styles.stepNumber} aria-hidden="true">
                  {step.number}
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Moped Test Banner ===== */}
      <section className={styles.bannerSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.banner}>
            <div className={styles.bannerContent}>
              <span className={styles.bannerLabel}>安全運転のために</span>
              <h2 className={styles.bannerTitle}>
                原付免許試験の練習ができます
              </h2>
              <p className={styles.bannerDesc}>
                原付免許の取得を目指す方向けに、学科試験の○×問題を練習できます。
              </p>
            </div>
            <Link href="/moped-test" className={styles.bannerButton}>
              練習を始める
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className={styles.ctaSection} aria-labelledby="cta-heading">
        <div className={styles.sectionContainer}>
          <div className={styles.ctaCard}>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              今すぐ愛車の記録を始めよう
            </h2>
            <p className={styles.ctaDesc}>
              無料プランで基本機能すべてが使えます。バイク2台まで登録でき、給油・メンテナンス・ツーリングを記録できます。
            </p>
            <ul className={styles.ctaFeatures}>
              {freeFeatures.map((f) => (
                <li key={f} className={styles.ctaFeatureItem}>
                  <Check size={16} aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/app/login"
              className={styles.ctaButton}
              target="_blank"
              rel="noreferrer"
            >
              無料で始める
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className={styles.ctaNote}>
              クレジットカード不要 · いつでも退会可能
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
