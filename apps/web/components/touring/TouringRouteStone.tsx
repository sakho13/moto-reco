import type { CSSProperties } from 'react'
import type { ApiResponseTouringListItem } from '@repo/shared-types'
import { TouringRouteShape } from './TouringRouteShape'
import styles from './TouringRouteStone.module.css'
import {
  getListRoutePoints,
  getStoneShape,
  getTouringDistance,
  getTouringStoneWidth,
  projectRoute,
} from '@/lib/utils/touringJourney'

type Props = {
  touring: ApiResponseTouringListItem
}

/**
 * 一覧の行に置く、経路の形を入れた石
 *
 * @remarks
 * 走行距離が長いほど大きくなる。経路を描けないときは開始日の「日」を出す。
 * 同じ内容を行の本文でも読めるため、読み上げの対象にはしない。
 */
export function TouringRouteStone({ touring }: Props) {
  const width = getTouringStoneWidth(getTouringDistance(touring))
  const height = Math.round(width * 0.95)
  const padding = Math.round(width * 0.2)
  const points = getListRoutePoints(touring)
  const canDrawRoute = projectRoute(points, width, height, padding).length > 0

  const style = {
    '--stone-width': `${width}px`,
    '--stone-height': `${height}px`,
    borderRadius: getStoneShape(touring.touringId),
  } as CSSProperties

  return (
    <span
      className={`${styles.stone} ${touring.status === 'STARTED' ? styles.started : ''}`}
      style={style}
      aria-hidden="true"
    >
      {canDrawRoute ? (
        <TouringRouteShape
          className={styles.shape}
          points={points}
          width={width}
          height={height}
          padding={padding}
          strokeWidth={2.5}
        />
      ) : (
        <span className={styles.day}>
          {new Date(touring.startDate).getDate()}
          <small className={styles.dayUnit}>日</small>
        </span>
      )}
    </span>
  )
}
