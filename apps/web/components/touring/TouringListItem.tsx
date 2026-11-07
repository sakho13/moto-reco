'use client'

import type { ApiResponseTouringListItem } from '@repo/shared-types'
import styles from './TouringListItem.module.css'
import { TouringPebbles } from './TouringPebbles'
import { TouringRouteStone } from './TouringRouteStone'
import { TouringStatusMark } from './TouringStatusMark'
import { formatMonthDay, getTouringDistance } from '@/lib/utils/touringJourney'

export interface TouringListItemProps {
  touring: ApiResponseTouringListItem
  onDetail: (touringId: string) => void
}

const formatPeriod = (touring: ApiResponseTouringListItem): string => {
  const start = formatMonthDay(touring.startDate)
  const isSameDay =
    new Date(touring.startDate).toDateString() ===
    new Date(touring.endDate).toDateString()
  if (touring.status === 'STARTED' || isSameDay) return start
  return `${start} 〜 ${formatMonthDay(touring.endDate)}`
}

const formatMeter = (touring: ApiResponseTouringListItem): string | null => {
  if (touring.startMileage === null) return null
  const start = `${touring.startMileage.toLocaleString()}km`
  return touring.endMileage === null
    ? start
    : `${start} → ${touring.endMileage.toLocaleString()}km`
}

export const TouringListItem = ({
  touring,
  onDetail,
}: TouringListItemProps) => {
  const distance = getTouringDistance(touring)
  const meter = formatMeter(touring)

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        onClick={() => onDetail(touring.touringId)}
      >
        <span className={styles.stoneSlot}>
          <TouringRouteStone touring={touring} />
        </span>

        <span className={styles.body}>
          <span className={styles.titleRow}>
            <span className={styles.title}>{touring.title}</span>
            <TouringStatusMark status={touring.status} size="sm" />
          </span>
          <span className={styles.meta}>
            {formatPeriod(touring)}
            {distance !== null && ` ・ ${distance.toLocaleString()}km`}
          </span>
          <TouringPebbles stops={touring.stops} status={touring.status} />
          {meter && <span className={styles.meter}>{meter}</span>}
        </span>

        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  )
}
