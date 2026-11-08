'use client'

import { Bike, ExternalLink, MapPin } from 'lucide-react'
import { useEffect } from 'react'
import type { ApiResponsePhotoDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './TouringJourney.module.css'
import { TouringPhotoStone, TouringStone } from './TouringStone'
import { useElementWidth } from '@/lib/hooks/useElementWidth'
import type { SpotPhotoMap } from '@/lib/hooks/useTouringSpotPhotos'
import { calcTravelMinutes } from '@/lib/utils/googleMaps'
import type {
  Journey,
  JourneyLeg,
  JourneyNode,
  JourneyRow,
  JourneySide,
} from '@/lib/utils/touringJourney'
import {
  formatClock,
  formatDuration,
  formatStayTime,
  getLegHeight,
  layoutJourney,
} from '@/lib/utils/touringJourney'

type Props = {
  journey: Journey
  now: Date
  /** 地図で強調している地点のID */
  focusedId: string | null
  /** 座標のある地点の「地図」を押したとき */
  onShowOnMap: (nodeId: string) => void
  /** スポットが1件もないときの追加ボタン。未指定なら出さない */
  onAddSpot?: () => void
  /** 地点IDごとの写真。未指定なら写真を出さない */
  photosBySpotId?: SpotPhotoMap
  /** 写真を押したとき。`index` はその地点の写真の何枚目か（0始まり） */
  onOpenPhoto?: (nodeId: string, index: number) => void
}

type PhotoProps = {
  photos: ApiResponsePhotoDetail[]
  onOpenPhoto: (nodeId: string, index: number) => void
}

/** 石を置く列の幅の半分。道はこの位置を通る */
const ROAD_INSET = 44
const HERE_EXTRA_HEIGHT = 56
const EMPTY_LEG_HEIGHT = 150
const TAIL_HEIGHT = 64

export const sideClass = (side: JourneySide): string =>
  side === 'right' ? styles.rowReverse! : ''

export const roadX = (side: JourneySide, width: number): number =>
  side === 'left' ? ROAD_INSET : width - ROAD_INSET

function MapLinkButton({
  nodeId,
  onShowOnMap,
}: {
  nodeId: string
  onShowOnMap: (nodeId: string) => void
}) {
  return (
    <button
      type="button"
      className={styles.mapLink}
      onClick={() => onShowOnMap(nodeId)}
    >
      <MapPin size={13} aria-hidden="true" />
      地図
    </button>
  )
}

function NodeStone({
  node,
  photo,
}: {
  node: JourneyNode
  photo: PhotoProps | null
}) {
  const first = photo?.photos[0]
  if (!photo || !first) return <TouringStone node={node} />
  return (
    <TouringPhotoStone
      node={node}
      photo={first}
      onOpen={() => photo.onOpenPhoto(node.id, 0)}
    />
  )
}

/** 2枚目以降の写真 */
function PhotoThumbnails({
  node,
  photo,
}: {
  node: JourneyNode
  photo: PhotoProps | null
}) {
  const rest = photo?.photos.slice(1) ?? []
  if (!photo || rest.length === 0) return null
  return (
    <div className={styles.thumbnails}>
      {rest.map((item, i) => (
        <button
          key={item.photoId}
          type="button"
          className={styles.thumbnail}
          aria-label={`${node.name}の写真 ${i + 2}枚目を開く`}
          onClick={() => photo.onOpenPhoto(node.id, i + 1)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.photoUrl}
            alt=""
            className={styles.thumbnailImage}
            loading="lazy"
            decoding="async"
          />
        </button>
      ))}
    </div>
  )
}

function StopLabel({
  node,
  photo,
  onShowOnMap,
}: {
  node: JourneyNode
  photo: PhotoProps | null
  onShowOnMap: (nodeId: string) => void
}) {
  const time = formatStayTime(node)
  const planned =
    node.plannedArrivalAt && !node.arrivedAt
      ? `予定 ${formatClock(node.plannedArrivalAt)}`
      : null
  const details = [
    time,
    planned,
    node.mileage !== null ? `${node.mileage.toLocaleString()}km` : null,
  ].filter((text): text is string => text !== null)

  return (
    <div className={styles.label}>
      {node.isLongestStay && <span className={styles.tag}>いちばん長居</span>}
      {node.isCurrent && <span className={styles.tag}>今ここ</span>}
      <h3
        className={`${styles.name} ${node.isPending && node.kind !== 'end' ? styles.nameMuted : ''}`}
      >
        {node.name}
      </h3>
      <div className={styles.meta}>
        {details.length > 0 && <span>{details.join(' ・ ')}</span>}
        {node.point && (
          <MapLinkButton nodeId={node.id} onShowOnMap={onShowOnMap} />
        )}
      </div>
      {node.memo && <p className={styles.memo}>{node.memo}</p>}
      <PhotoThumbnails node={node} photo={photo} />
    </div>
  )
}

function StopRow({
  row,
  isFocused,
  photo,
  onShowOnMap,
}: {
  row: Extract<JourneyRow, { type: 'stop' }>
  isFocused: boolean
  photo: PhotoProps | null
  onShowOnMap: (nodeId: string) => void
}) {
  return (
    <div
      data-node-id={row.node.id}
      className={`${styles.row} ${sideClass(row.side)} ${isFocused ? styles.focused : ''}`}
    >
      <div className={styles.slot}>
        <NodeStone node={row.node} photo={photo} />
        {row.hasTrail && <div className={styles.trail} />}
      </div>
      <StopLabel node={row.node} photo={photo} onShowOnMap={onShowOnMap} />
    </div>
  )
}

function SkipRow({
  row,
  isFocused,
  photo,
  onShowOnMap,
}: {
  row: Extract<JourneyRow, { type: 'skip' }>
  isFocused: boolean
  photo: PhotoProps | null
  onShowOnMap: (nodeId: string) => void
}) {
  const stoneSide: JourneySide = row.roadSide === 'left' ? 'right' : 'left'

  return (
    <div
      data-node-id={row.node.id}
      className={`${styles.row} ${styles.skipRow} ${sideClass(stoneSide)} ${
        row.roadSide === 'left' ? styles.skipRoadLeft : styles.skipRoadRight
      } ${isFocused ? styles.focused : ''}`}
    >
      <div className={styles.skipTrail} aria-hidden="true" />
      <div className={styles.slot}>
        <NodeStone node={row.node} photo={photo} />
      </div>
      <div className={styles.label}>
        <h3 className={`${styles.name} ${styles.nameMuted}`}>
          {row.node.name}
          <span className={styles.skipBadge}>スキップ</span>
        </h3>
        {(row.node.skippedAt || row.node.point) && (
          <div className={styles.meta}>
            {row.node.skippedAt && (
              <span>スキップ {formatClock(row.node.skippedAt)}</span>
            )}
            {row.node.point && (
              <MapLinkButton nodeId={row.node.id} onShowOnMap={onShowOnMap} />
            )}
          </div>
        )}
        {row.node.memo && <p className={styles.memo}>{row.node.memo}</p>}
        <PhotoThumbnails node={row.node} photo={photo} />
      </div>
    </div>
  )
}

function LegChip({ leg }: { leg: JourneyLeg }) {
  const travel =
    leg.minutes !== null ? `移動 ${formatDuration(leg.minutes)}` : ''
  const content = (
    <>
      {leg.dayNumber !== null && (
        <b className={styles.chipDay}>{leg.dayNumber}日目</b>
      )}
      {leg.isLongest && <b className={styles.chipLongest}>最長</b>}
      {travel}
    </>
  )

  if (leg.href) {
    return (
      <a
        className={styles.chipLink}
        href={leg.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Googleマップで経路を開く${travel ? `（${travel}）` : ''}`}
      >
        <span className={styles.chip}>
          {content}
          {!travel && '経路'}
          <ExternalLink size={12} aria-hidden="true" />
        </span>
      </a>
    )
  }

  if (!travel && leg.dayNumber === null) return null
  return <span className={styles.chip}>{content}</span>
}

function HereMarker({
  from,
  now,
}: {
  from: JourneyNode | undefined
  now: Date
}) {
  const ridingMinutes = calcTravelMinutes(from?.departedAt, now.toISOString())

  return (
    <span className={styles.here}>
      <span className={styles.hereStone}>
        <Bike size={24} aria-hidden="true" />
      </span>
      <span>
        <b className={styles.hereTitle}>今ここ</b>
        <span className={styles.hereDetail}>
          {formatClock(now.toISOString())}
          {ridingMinutes !== null &&
            ` ・ 走行 ${formatDuration(ridingMinutes)}`}
        </span>
      </span>
    </span>
  )
}

function EmptyMessage({ onAddSpot }: { onAddSpot?: () => void }) {
  return (
    <>
      <p className={styles.emptyText}>スポットはまだ記録されていません</p>
      {onAddSpot && (
        <Button type="button" variant="cloud" onClick={onAddSpot}>
          ＋ 寄った場所を追加
        </Button>
      )}
    </>
  )
}

export function Road({
  width,
  height,
  fromX,
  toX,
}: {
  width: number
  height: number
  fromX: number
  toX: number
}) {
  if (width === 0) return null
  return (
    <svg
      className={styles.roadSvg}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path
        className={styles.road}
        d={`M${fromX} 0C${fromX} ${height * 0.55} ${toX} ${height * 0.45} ${toX} ${height}`}
      />
    </svg>
  )
}

/**
 * ツーリングの道のりを飛び石で表示する
 *
 * @remarks
 * 石は訪れた順に左右交互に置き、点線の道でつなぐ。移動時間が長いほど石の間隔が開く。
 * スキップした地点は道の向かいに破線の石で置き、道はそこを通らない。
 * 石そのものは操作対象にせず、地図と経路のリンクだけを押せるようにする。
 */
export function TouringJourney({
  journey,
  now,
  focusedId,
  onShowOnMap,
  onAddSpot,
  photosBySpotId,
  onOpenPhoto,
}: Props) {
  const [roadRef, width] = useElementWidth<HTMLDivElement>()
  const getPhoto = (nodeId: string): PhotoProps | null => {
    const photos = photosBySpotId?.get(nodeId)
    return photos && photos.length > 0 && onOpenPhoto
      ? { photos, onOpenPhoto }
      : null
  }
  const rows = layoutJourney(journey)
  const nodeById = new Map(journey.nodes.map((node) => [node.id, node]))
  const isEmpty = journey.nodes.every(
    (node) => node.kind === 'start' || node.kind === 'end'
  )

  useEffect(() => {
    if (!focusedId) return
    roadRef.current
      ?.querySelector(`[data-node-id="${CSS.escape(focusedId)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedId, roadRef])

  return (
    <div ref={roadRef} className={styles.journey}>
      {rows.map((row) => {
        switch (row.type) {
          case 'stop':
            return (
              <StopRow
                key={row.node.id}
                row={row}
                isFocused={focusedId === row.node.id}
                photo={getPhoto(row.node.id)}
                onShowOnMap={onShowOnMap}
              />
            )
          case 'skip':
            return (
              <SkipRow
                key={row.node.id}
                row={row}
                isFocused={focusedId === row.node.id}
                photo={getPhoto(row.node.id)}
                onShowOnMap={onShowOnMap}
              />
            )
          case 'leg': {
            const baseHeight = isEmpty
              ? EMPTY_LEG_HEIGHT
              : getLegHeight(row.leg.minutes)
            const height = baseHeight + (row.showsHere ? HERE_EXTRA_HEIGHT : 0)
            return (
              <div
                key={`leg-${row.leg.fromId}`}
                className={styles.leg}
                style={{ height }}
              >
                <Road
                  width={width}
                  height={height}
                  fromX={roadX(row.fromSide, width)}
                  toX={roadX(row.toSide, width)}
                />
                <div
                  className={`${styles.legCenter} ${isEmpty ? styles.legCenterEmpty : ''}`}
                >
                  {row.showsHere && (
                    <HereMarker from={nodeById.get(row.leg.fromId)} now={now} />
                  )}
                  <LegChip leg={row.leg} />
                  {isEmpty && (
                    <EmptyMessage
                      onAddSpot={row.showsHere ? undefined : onAddSpot}
                    />
                  )}
                </div>
              </div>
            )
          }
          case 'tail':
            return (
              <div key="tail" className={styles.tail}>
                <div className={styles.leg} style={{ height: TAIL_HEIGHT }}>
                  <Road
                    width={width}
                    height={TAIL_HEIGHT}
                    fromX={roadX(row.fromSide, width)}
                    toX={width / 2}
                  />
                </div>
                <HereMarker
                  from={nodeById.get(journey.hereAfterId ?? '')}
                  now={now}
                />
                {isEmpty && <EmptyMessage />}
              </div>
            )
        }
      })}
    </div>
  )
}
