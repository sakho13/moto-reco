import type {
  ApiResponseTouringDetail,
  ApiResponseTouringStop,
} from '@repo/shared-types'
import styles from './TouringPebbles.module.css'
import { getStoneShape, orderTouringStops } from '@/lib/utils/touringJourney'

type Props = {
  stops: ApiResponseTouringStop[]
  status: ApiResponseTouringDetail['status']
}

const MAX_VISIBLE_PEBBLES = 12

const getPebbleClass = (
  stop: ApiResponseTouringStop,
  isStarted: boolean
): string => {
  if (stop.isSkipped) return styles.skip!
  if (isStarted && !stop.hasArrived) return styles.pending!
  return stop.type === 'BREAK' ? styles.rest! : styles.spot!
}

/**
 * ツーリングで立ち寄った地点の数を小石で並べる
 *
 * @remarks
 * スポットは小さな石、休憩はさらに小さな石、スキップは破線の石で、走行順に並べる。
 * 進行中でまだ着いていない地点は縁取りだけの石で出し、数には含めない。
 * 多いときは先頭から12個までを出し、残りは `+N` で示す。
 */
export function TouringPebbles({ stops, status }: Props) {
  if (stops.length === 0) return null

  const isStarted = status === 'STARTED'
  const ordered = orderTouringStops(stops, status)
  const visited = stops.filter(
    (stop) => !stop.isSkipped && (!isStarted || stop.hasArrived)
  )
  const spotCount = visited.filter((stop) => stop.type === 'SPOT').length
  const breakCount = visited.filter((stop) => stop.type === 'BREAK').length
  const skippedCount = stops.filter((stop) => stop.isSkipped).length
  const hiddenCount = Math.max(0, stops.length - MAX_VISIBLE_PEBBLES)

  const spokenLabel = [
    spotCount > 0 ? `寄り道${spotCount}か所` : null,
    breakCount > 0 ? `休憩${breakCount}回` : null,
    skippedCount > 0 ? `スキップ${skippedCount}か所` : null,
  ]
    .filter((text) => text !== null)
    .join('、')
  const pendingCount = stops.length - visited.length - skippedCount

  const visibleCounts = [
    spotCount > 0 ? `${spotCount}か所` : null,
    breakCount > 0 ? `休憩${breakCount}回` : null,
  ].filter((text) => text !== null)
  const visibleLabel =
    visibleCounts.length > 0
      ? visibleCounts.join(' ・ ')
      : skippedCount > 0
        ? `スキップ${skippedCount}か所`
        : `これから${pendingCount}か所`

  return (
    <span
      className={styles.pebbles}
      role="img"
      aria-label={spokenLabel || `これから${pendingCount}か所`}
    >
      <span className={styles.stones} aria-hidden="true">
        {ordered.slice(0, MAX_VISIBLE_PEBBLES).map((stop, index) => (
          <span
            key={index}
            className={`${styles.pebble} ${getPebbleClass(stop, isStarted)}`}
            style={{ borderRadius: getStoneShape(String(index)) }}
          />
        ))}
        {hiddenCount > 0 && <span className={styles.more}>+{hiddenCount}</span>}
      </span>
      <span aria-hidden="true">{visibleLabel}</span>
    </span>
  )
}
