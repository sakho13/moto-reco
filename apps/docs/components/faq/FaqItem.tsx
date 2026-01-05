'use client'

import { useState } from 'react'
import styles from './FaqItem.module.css'

interface FaqItemProps {
  question: string
  answer: string
  isInitiallyOpen?: boolean
}

export function FaqItem({
  question,
  answer,
  isInitiallyOpen = false,
}: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen)

  return (
    <div className={styles.faqItem}>
      <button
        className={styles.question}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`answer-${question}`}
      >
        <span className={styles.questionText}>{question}</span>
        <span
          className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
          aria-hidden="true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        id={`answer-${question}`}
        className={`${styles.answer} ${isOpen ? styles.answerOpen : ''}`}
        aria-hidden={!isOpen}
      >
        <p>{answer}</p>
      </div>
    </div>
  )
}
