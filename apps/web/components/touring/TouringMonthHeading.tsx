import styles from './TouringMonthHeading.module.css'
import { getTouringDistance } from '@/lib/utils/touringJourney'

type Props = {
  label: string
  count: number
  totalDistance: number
}

/** ツーリングの走行距離の合計（km）。未記録のものは数えない */
export const sumTouringDistance = (
  tourings: { startMileage: number | null; endMileage: number | null }[]
): number =>
  tourings.reduce(
    (total, touring) => total + (getTouringDistance(touring) ?? 0),
    0
  )

/** `5回 ・ 883km` の形に整える。距離の合計が0のときはkmを出さない */
export const formatTouringSummary = (
  count: number,
  unit: '回' | '件',
  totalDistance: number
): string =>
  totalDistance > 0
    ? `${count}${unit} ・ ${totalDistance.toLocaleString()}km`
    : `${count}${unit}`

/** ツーリング一覧の月ごとの見出し */
export function TouringMonthHeading({ label, count, totalDistance }: Props) {
  return (
    <h3 className={styles.heading}>
      <span className={styles.label}>{label}</span>
      <span className={styles.summary}>
        {formatTouringSummary(count, '回', totalDistance)}
      </span>
    </h3>
  )
}
