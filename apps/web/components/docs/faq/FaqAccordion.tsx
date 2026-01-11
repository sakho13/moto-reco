'use client'

import styles from './FaqAccordion.module.css'
import { FaqItem } from './FaqItem'

interface FaqAccordionProps {
  category: string
  items: Array<{ question: string; answer: string }>
}

export function FaqAccordion({ category, items }: FaqAccordionProps) {
  return (
    <div className={styles.accordion}>
      <h3 className={styles.categoryTitle}>{category}</h3>
      <div className={styles.itemList}>
        {items.map((item, index) => (
          <FaqItem
            key={`${category}-${index}`}
            question={item.question}
            answer={item.answer}
          />
        ))}
      </div>
    </div>
  )
}
