import { FAQ_DATA, FAQ_CATEGORIES } from './faqData'
import styles from './page.module.css'
import { FaqAccordion } from '@/components/docs/faq/FaqAccordion'
import { APP_NAME } from '@/lib/statics'

export const metadata = {
  title: `よくある質問 | ${APP_NAME}`,
  description:
    `${APP_NAME} の使い方や機能に関するよくある質問と回答をまとめています。`,
}

export default function FaqPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>よくある質問</h1>
        <p className={styles.description}>
          moto-recoの使い方や機能に関する、よくある質問と回答をまとめています。
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
