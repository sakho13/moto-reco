import type { Metadata } from 'next'
import styles from './page.module.css'
import {
  ACCOUNT_LIMITS,
  COMPARISON_ROWS,
  GUEST_ACCOUNT_TTL_DAYS,
  PRICING_PLANS,
  formatLimit,
  formatMcpAccess,
} from './pricingData'
import { PricingCard } from '@/components/docs/pricing/PricingCard'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `料金プラン`,
  description: `${APP_NAME}の料金プランをご確認いただけます。無料プランですべての基本機能(バイク登録${formatLimit(ACCOUNT_LIMITS.free.bike, '台まで')}、メンテナンス記録、給油記録)をご利用いただけます。`,
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
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <div className="public-page-container">
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

      <section className={styles.comparisonSection}>
        <h2 className={styles.comparisonTitle}>機能・制限一覧</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th className={styles.featureCol}>機能</th>
                <th>ゲストアカウント</th>
                <th>無料プラン</th>
                <th className={styles.premiumCol}>プレミアムプラン</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>{row.guest}</td>
                  <td>{row.free}</td>
                  <td className={styles.comingSoon}>{row.premium}（予定）</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.comparisonNote}>
          ※ゲストアカウントは登録から{GUEST_ACCOUNT_TTL_DAYS}日間有効です。
        </p>
      </section>

      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>プランに関する質問</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>無料プランに制限はありますか?</h3>
            <p>
              はい。無料プランでは、バイク登録は
              {formatLimit(ACCOUNT_LIMITS.free.bike, '台まで')}
              、ツーリングプランは1台あたり
              {formatLimit(ACCOUNT_LIMITS.free.touringPlan, '件まで')}
              です。MCP連携（AIアシスタント）は
              {formatMcpAccess(ACCOUNT_LIMITS.free.allowedScopes)}
              となります。給油履歴・メンテナンス記録・ツーリング記録・購入グッズは件数の制限なくご利用いただけます。
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
          <div className={styles.faqItem}>
            <h3>プランが下がった場合、登録済みのデータはどうなりますか?</h3>
            <p>
              プランが下がっても、登録済みのデータは削除されません。閲覧・編集・削除はこれまでどおりご利用いただけます。
              上限を超えている項目は、上限内に収まるまで新規登録ができなくなります。
              また、MCP連携（AIアシスタント）の書き込み機能はプランが下がった時点でご利用いただけなくなります。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
