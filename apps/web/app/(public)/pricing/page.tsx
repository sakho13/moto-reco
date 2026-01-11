import styles from './page.module.css'
import { PRICING_PLANS } from './pricingData'
import { PricingCard } from '@/components/docs/pricing/PricingCard'

export const metadata = {
  title: '料金プラン | moto-reco Docs',
  description:
    'moto-recoの料金プランをご確認いただけます。無料プランですべての基本機能をご利用いただけます。',
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
