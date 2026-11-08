import styles from './TouringRouteShape.module.css'
import type { JourneyPoint } from '@/lib/utils/touringJourney'
import { projectRoute } from '@/lib/utils/touringJourney'

/** これを超える地点数では点が重なるので、出発地の点だけを描く */
const MAX_DOTTED_POINTS = 8

type Props = {
  points: JourneyPoint[]
  width: number
  height: number
  /** 外周の余白（px） */
  padding?: number
  /** 線の太さ（px）。点の半径もこれに比例する */
  strokeWidth?: number
  className?: string
}

/**
 * ツーリングの経路の形を座標から描く
 *
 * @remarks
 * 地点を直線で結んだ形で、道路の形状は反映しない。線の色は `currentColor`。
 * 描ける形がないとき（2点未満、すべて同じ地点）は何も描画しない。
 */
export function TouringRouteShape({
  points,
  width,
  height,
  padding = 8,
  strokeWidth = 4,
  className,
}: Props) {
  const projected = projectRoute(points, width, height, padding)
  if (projected.length === 0) return null

  const path = projected
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join('')
  const dotRadius = strokeWidth * 1.1

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path className={styles.line} d={path} strokeWidth={strokeWidth} />
      {(projected.length > MAX_DOTTED_POINTS
        ? projected.slice(0, 1)
        : projected
      ).map((point, index) => (
        <circle
          key={`${index}-${point.x}-${point.y}`}
          className={index === 0 ? styles.startDot : styles.dot}
          cx={point.x}
          cy={point.y}
          r={dotRadius}
          strokeWidth={strokeWidth * 0.6}
        />
      ))}
    </svg>
  )
}
