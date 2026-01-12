'use client'

import { type HTMLAttributes, useState } from 'react'
import styles from './toggleSection.module.css'

/**
 * ToggleSectionコンポーネントのプロパティ
 */
export interface ToggleSectionProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * トグルのタイトル
   */
  title: string
  /**
   * 初期表示状態
   */
  defaultOpen?: boolean
  /**
   * トグル内のコンテンツ
   */
  children: React.ReactNode
}

/**
 * ToggleSectionコンポーネント
 *
 * @remarks
 * クリックで表示/非表示を切り替えられるコンテンツコンテナ。
 */
export const ToggleSection = ({
  title,
  defaultOpen = false,
  className,
  children,
  ...props
}: ToggleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const sectionClasses = [styles.toggleSection, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={sectionClasses} {...props}>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className={styles.icon} aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  )
}
