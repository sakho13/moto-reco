import type { Metadata } from 'next'
import styles from './page.module.css'
import { PRICING_PLANS } from './pricingData'
import { PricingCard } from '@/components/docs/pricing/PricingCard'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `料金プラン`,
  description: `${APP_NAME}の料金プランをご確認いただけます。無料プランですべての基本機能(バイク登録2台まで、メンテナンス記録、給油記録)をご利用いただけます。`,
  openGraph: {
    url: `${SITE_URL}/pricing`,
    title: `料金プラン | ${APP_NAME}`,
    description: `${APP_NAME}の料金プラン。無料プランですべての基本機能をご利用いただけます。`,
    images: ['/top_image_1.png'],
  },
  twitter: {
    title: `料金プラン | ${APP_NAME}`,
    description: `${APP_NAME}の料金プラン。無料プランですべての基本機能をご利用いただけます。`,
    images: ['/top_image_1.png'],
  },
}

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>料金プラン</h1>
        <p className={styles.description}>
          無料プランですべての基本機能をご利用いただけます。
          <br />
          プレミアムプランは現在準備中です。
        </p>
      </header>

      <div className={styles.pricingGrid}>
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            name={plan.name}
            price={plan.price}
            period={plan.period}
            description={plan.description}
            features={plan.features}
            ctaLabel={plan.ctaLabel}
            ctaHref={plan.ctaHref}
            badge={plan.badge}
            isPopular={plan.isPopular}
            isComingSoon={plan.isComingSoon}
          />
        ))}
      </div>

      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>プランに関する質問</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>無料プランに制限はありますか?</h3>
            <p>
              はい、無料プランではバイク登録が2台までとなっていますが、その他の基本機能はすべてご利用いただけます。
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3>プレミアムプランはいつ利用できますか?</h3>
            <p>
              プレミアムプランは現在開発中です。
              リリース時期が決まり次第、このページおよびアプリ内でお知らせします。
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3>プランの変更は可能ですか?</h3>
            <p>
              プレミアムプランリリース後は、いつでもプラン変更が可能です。
              アカウント設定から簡単に変更できます。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
