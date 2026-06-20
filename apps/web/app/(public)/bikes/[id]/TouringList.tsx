'use client'

import { useState } from 'react'
import { formatDateTime } from '@repo/shared-utils'
import styles from './page.module.css'
import touringStyles from './TouringList.module.css'

type Touring = {
  touringId: string
  title: string
  startDate: Date
  endDate: Date
  startMileage: number | null
  endMileage: number | null
  status: 'STARTED' | 'COMPLETED'
}

type Props = {
  tourings: Touring[]
}

const INITIAL_COUNT = 3

export default function TouringList({ tourings }: Props) {
  const [expanded, setExpanded] = useState(false)

  const displayed = expanded ? tourings : tourings.slice(0, INITIAL_COUNT)
  const hasMore = tourings.length > INITIAL_COUNT

  if (tourings.length === 0) {
    return <p>ツーリング履歴はありません。</p>
  }

  return (
    <>
      {displayed.map((touring) => {
        const start = formatDateTime(touring.startDate)
        const end = formatDateTime(touring.endDate)
        const mileage =
          touring.startMileage !== null && touring.endMileage !== null
            ? `${(touring.endMileage - touring.startMileage).toLocaleString()} km`
            : null

        return (
          <div key={touring.touringId} className={styles.pair}>
            <span className={styles.value}>{touring.title}</span>
            <span className={styles.label}>
              {start} 〜 {end}
              {mileage ? ` / ${mileage}` : ''}
            </span>
          </div>
        )
      })}
      {hasMore && (
        <button
          type="button"
          className={touringStyles.toggleButton}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? '閉じる'
            : `他 ${tourings.length - INITIAL_COUNT} 件を表示`}
        </button>
      )}
    </>
  )
}
