import Link from 'next/link'
import styles from './home.module.css'

const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'

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
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <p className={styles.badge}>moto-reco Docs</p>
          <h1 className={styles.title}>バイクメンテナンスを、もっと分かりやすく。</h1>
          <p className={styles.lead}>
            moto-recoは、バイクのメンテナンス履歴・給油記録・スケジュールを一元管理するためのアプリです。
            必要な情報をすぐに探せるよう、機能ごとにガイドを整理しています。
          </p>
        </div>
        <div className={styles.ctaGroup}>
          <Link className={styles.primaryButton} href={`${webUrl}/login`} target="_blank" rel="noreferrer">
            ログインして使ってみる
          </Link>
          <Link className={styles.secondaryButton} href="/ref">
            APIリファレンスを見る
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
              <img
                className={styles.cardImage}
                src={feature.image}
                alt={`${feature.title}のスクリーンショット`}
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

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>ログインへのナビゲート</h2>
          <p>実際の操作はWebアプリから行えます。まずはログインして試してみましょう。</p>
        </div>
        <div className={styles.loginCard}>
          <div>
            <h3>moto-reco Webアプリ</h3>
            <p>メール/パスワード、またはGoogleアカウントでログインできます。</p>
          </div>
          <Link className={styles.primaryButton} href={`${webUrl}/login`} target="_blank" rel="noreferrer">
            ログイン画面へ
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <p>moto-reco Documentation</p>
          <span>プロダクトの詳細は随時更新されます。</span>
        </div>
        <Link className={styles.footerLink} href="/ref">
          OpenAPI Reference
        </Link>
      </footer>
    </div>
  )
}
