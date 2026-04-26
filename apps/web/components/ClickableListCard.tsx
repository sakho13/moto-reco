'use client'

import { ChevronRight } from 'lucide-react'
import styles from './ClickableListCard.module.css'

type ClickableListCardProps = {
  onClick: () => void
  children: React.ReactNode
}

export const ClickableListCard = ({
  onClick,
  children,
}: ClickableListCardProps) => {
  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.content}>{children}</div>
      <ChevronRight className={styles.chevron} />
    </button>
  )
}
