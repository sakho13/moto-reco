import type { CSSProperties } from 'react'
import styles from './TouringStone.module.css'
import type { JourneyNode } from '@/lib/utils/touringJourney'
import {
  formatDuration,
  getStoneShape,
  getStoneWidth,
} from '@/lib/utils/touringJourney'

type Props = {
  node: JourneyNode
}

const getStoneClass = (node: JourneyNode): string => {
  if (node.kind === 'skip') return styles.skip!
  if (node.isPending) return styles.pending!
  if (node.kind === 'start' || node.kind === 'end') return styles.flag!
  return styles.stay!
}

const getStoneCaption = (node: JourneyNode): string | null => {
  if (node.isCurrent && node.kind === 'break') return '休憩中'
  if (node.isCurrent) return '滞在中'
  return node.stayMinutes === null ? null : formatDuration(node.stayMinutes)
}

/**
 * 道のりの1地点を表す石
 *
 * @remarks
 * スポットは滞在時間が長いほど大きくなる。形は地点のIDから決まる。
 */
export function TouringStone({ node }: Props) {
  const style = {
    '--stone-width': `${getStoneWidth(node)}px`,
    borderRadius: getStoneShape(node.id),
  } as CSSProperties
  const caption = getStoneCaption(node)

  return (
    <div className={`${styles.stone} ${getStoneClass(node)}`} style={style}>
      <span className={styles.mark}>
        {node.kind === 'skip' ? '不在' : node.mark}
      </span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  )
}
