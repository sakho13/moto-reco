import { FaqAccordion } from '../../components/faq/FaqAccordion'
import { FAQ_DATA, FAQ_CATEGORIES } from './faqData'
import styles from './page.module.css'

export const metadata = {
  title: 'よくある質問 | moto-reco Docs',
  description:
    'moto-recoの使い方や機能に関するよくある質問と回答をまとめています。',
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
