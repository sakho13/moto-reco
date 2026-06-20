import { ChevronRight, Fuel, MapPin } from 'lucide-react'
import type { ApiResponseAllBikesHistoryItem } from '@repo/shared-types'
import { formatDateTime } from '@repo/shared-utils'
import styles from './HistoryItemCard.module.css'

type Props = {
  item: ApiResponseAllBikesHistoryItem
  onClick?: () => void
}

export const HistoryItemCard = ({ item, onClick }: Props) => {
  return (
    <div
      className={`${styles.historyItemCard} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.badges}>
            <span
              className={`${styles.badge} ${item.type === 'FUEL_LOG' ? styles.badgeFuel : styles.badgeTouring}`}
            >
              {item.type === 'FUEL_LOG' ? (
                <>
                  <Fuel size={12} />
                  給油
                </>
              ) : (
                <>
                  <MapPin size={12} />
                  ツーリング
                </>
              )}
            </span>
            <span className={styles.bikeName}>{item.bikeName}</span>
          </div>
          <span className={styles.date}>{formatDateTime(item.occurredAt)}</span>
        </div>

        {item.type === 'FUEL_LOG' ? (
          <div className={styles.detail}>
            <div>走行距離: {item.fuelLog.mileage.toLocaleString()} km</div>
            <div>
              給油量: {item.fuelLog.amount.toLocaleString()} L /{' '}
              {item.fuelLog.totalPrice.toLocaleString()} 円
            </div>
          </div>
        ) : (
          <div className={styles.detail}>
            <div>{item.touring.title}</div>
            <div>
              {formatDateTime(item.touring.startDate)} 〜{' '}
              {formatDateTime(item.touring.endDate)}
            </div>
          </div>
        )}
      </div>
      {onClick && <ChevronRight className={styles.chevron} />}
    </div>
  )
}
