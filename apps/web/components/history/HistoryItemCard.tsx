import { Camera, ChevronRight, Fuel, MapPin } from 'lucide-react'
import type { ApiResponseAllBikesHistoryItem } from '@repo/shared-types'
import styles from './HistoryItemCard.module.css'

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  item: ApiResponseAllBikesHistoryItem
  onClick?: () => void
}

export const HistoryItemCard = ({ item, onClick }: Props) => {
  const badgeClass =
    item.type === 'FUEL_LOG'
      ? styles.badgeFuel
      : item.type === 'TOURING'
        ? styles.badgeTouring
        : styles.badgePost

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
            <span className={`${styles.badge} ${badgeClass}`}>
              {item.type === 'FUEL_LOG' ? (
                <>
                  <Fuel size={12} />
                  給油
                </>
              ) : item.type === 'TOURING' ? (
                <>
                  <MapPin size={12} />
                  ツーリング
                </>
              ) : (
                <>
                  <Camera size={12} />
                  投稿
                </>
              )}
            </span>
            <span className={styles.bikeName}>{item.bikeName}</span>
          </div>
          <span className={styles.date}>{formatDate(item.occurredAt)}</span>
        </div>

        {item.type === 'FUEL_LOG' ? (
          <div className={styles.detail}>
            <div>走行距離: {item.fuelLog.mileage.toLocaleString()} km</div>
            <div>
              給油量: {item.fuelLog.amount.toLocaleString()} L /{' '}
              {item.fuelLog.totalPrice.toLocaleString()} 円
            </div>
          </div>
        ) : item.type === 'TOURING' ? (
          <div className={styles.detail}>
            <div>{item.touring.title}</div>
            <div>
              {new Date(item.touring.startDate).toLocaleDateString('ja-JP')} 〜{' '}
              {new Date(item.touring.endDate).toLocaleDateString('ja-JP')}
            </div>
          </div>
        ) : (
          <div className={styles.detail}>
            <div>{item.post.title ?? '（タイトルなし）'}</div>
            <div>写真 {item.post.photos.length} 枚</div>
          </div>
        )}
      </div>
      {onClick && <ChevronRight className={styles.chevron} />}
    </div>
  )
}
