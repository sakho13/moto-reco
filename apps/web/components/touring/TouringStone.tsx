import type { CSSProperties } from 'react'
import type { ApiResponsePhotoDetail } from '@repo/shared-types'
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

/** 写真を入れた石の最小幅（px） */
const PHOTO_STONE_MIN_WIDTH = 72

type PhotoStoneProps = {
  node: JourneyNode
  photo: ApiResponsePhotoDetail
  onOpen: () => void
}

/**
 * 写真のある地点の石
 *
 * @remarks
 * 石の形のまま1枚目の写真を入れ、番号を左上に重ねる。押すと写真を拡大表示する。
 */
export function TouringPhotoStone({ node, photo, onOpen }: PhotoStoneProps) {
  const style = {
    '--stone-width': `${Math.max(getStoneWidth(node), PHOTO_STONE_MIN_WIDTH)}px`,
    borderRadius: getStoneShape(node.id),
  } as CSSProperties

  return (
    <div
      className={`${styles.photoStone} ${node.kind === 'skip' ? styles.photoStoneSkip : ''}`}
      style={style}
    >
      <button
        type="button"
        className={styles.photoButton}
        aria-label={`${node.name}の写真を開く`}
        onClick={onOpen}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.photoUrl}
          alt=""
          className={styles.photo}
          loading="lazy"
          decoding="async"
        />
      </button>
      <span className={styles.pin}>
        {node.kind === 'skip' ? '不在' : node.mark}
      </span>
    </div>
  )
}
