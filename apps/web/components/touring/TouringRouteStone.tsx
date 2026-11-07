import type { CSSProperties, ReactNode } from 'react'
import type {
  ApiResponseTouringListItem,
  ApiResponseTouringPlanListItem,
} from '@repo/shared-types'
import { TouringRouteShape } from './TouringRouteShape'
import styles from './TouringRouteStone.module.css'
import type { JourneyPoint } from '@/lib/utils/touringJourney'
import {
  getListRoutePoints,
  getStoneShape,
  getTouringDistance,
  getTouringStoneWidth,
  projectRoute,
} from '@/lib/utils/touringJourney'
import {
  getPlanListRoutePoints,
  getPlanStoneWidth,
} from '@/lib/utils/touringPlanJourney'

function RouteStone({
  id,
  points,
  width,
  className = '',
  children,
}: {
  id: string
  points: JourneyPoint[]
  width: number
  className?: string
  /** 経路を描けないときに出す内容 */
  children: ReactNode
}) {
  const height = Math.round(width * 0.95)
  const padding = Math.round(width * 0.2)
  const canDrawRoute = projectRoute(points, width, height, padding).length > 0

  const style = {
    '--stone-width': `${width}px`,
    '--stone-height': `${height}px`,
    borderRadius: getStoneShape(id),
  } as CSSProperties

  return (
    <span
      className={`${styles.stone} ${className}`}
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
        children
      )}
    </span>
  )
}

/**
 * ツーリング一覧の行に置く、経路の形を入れた石
 *
 * @remarks
 * 走行距離が長いほど大きくなる。経路を描けないときは開始日の「日」を出す。
 * 同じ内容を行の本文でも読めるため、読み上げの対象にはしない。
 */
export function TouringRouteStone({
  touring,
}: {
  touring: ApiResponseTouringListItem
}) {
  return (
    <RouteStone
      id={touring.touringId}
      points={getListRoutePoints(touring)}
      width={getTouringStoneWidth(getTouringDistance(touring))}
      className={touring.status === 'STARTED' ? styles.started : ''}
    >
      <span className={styles.day}>
        {new Date(touring.startDate).getDate()}
        <small className={styles.dayUnit}>日</small>
      </span>
    </RouteStone>
  )
}

/**
 * プラン一覧の行に置く、経路の形を入れた破線の石
 *
 * @remarks
 * 予定が長いほど大きくなる。まだ走っていないので、走行記録の石と違って影を付けない。
 * 経路を描けないときは地点の数を出す。
 */
export function TouringPlanRouteStone({
  plan,
}: {
  plan: ApiResponseTouringPlanListItem
}) {
  return (
    <RouteStone
      id={plan.touringPlanId}
      points={getPlanListRoutePoints(plan)}
      width={getPlanStoneWidth(plan.plannedMinutes)}
      className={styles.planned}
    >
      <span className={styles.planText}>
        {plan.stops.length > 0 ? `${plan.stops.length}か所` : '未定'}
      </span>
    </RouteStone>
  )
}
