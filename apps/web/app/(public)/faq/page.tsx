import type { Metadata } from 'next'
import { FAQ_DATA, FAQ_CATEGORIES } from './faqData'
import styles from './page.module.css'
import { FaqAccordion } from '@/components/docs/faq/FaqAccordion'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: `よくある質問`,
  description: `${APP_NAME}の使い方や機能に関するよくある質問と回答。バイク登録、給油記録、メンテナンス履歴の管理方法、料金プラン、データの扱いなどについて解説しています。`,
  openGraph: {
    url: `${SITE_URL}/faq`,
    title: `よくある質問 | ${APP_NAME}`,
    description: `${APP_NAME}の使い方や機能に関するよくある質問と回答をまとめています。`,
    images: ['/top_image_1.png'],
  },
  twitter: {
    title: `よくある質問 | ${APP_NAME}`,
    description: `${APP_NAME}の使い方や機能に関するよくある質問と回答をまとめています。`,
    images: ['/top_image_1.png'],
  },
}

export default function FaqPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>よくある質問</h1>
        <p className={styles.description}>
          {APP_NAME}{' '}
          の使い方や機能に関する、よくある質問と回答をまとめています。
        </p>
      </header>

      <div className={styles.faqContainer}>
        {FAQ_CATEGORIES.map((category) => {
          const categoryItems = FAQ_DATA.filter(
            (item) => item.category === category
          )
          return (
            <FaqAccordion
              key={category}
              category={category}
              items={categoryItems}
            />
          )
        })}
      </div>
    </div>
  )
}
