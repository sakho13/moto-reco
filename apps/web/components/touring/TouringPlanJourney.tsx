'use client'

import { ExternalLink, MapPin, Pencil } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Road, roadX, sideClass } from './TouringJourney'
import journeyStyles from './TouringJourney.module.css'
import styles from './TouringPlanJourney.module.css'
import { TouringStone } from './TouringStone'
import { useElementWidth } from '@/lib/hooks/useElementWidth'
import type {
  JourneyLeg,
  JourneyNode,
  JourneyRow,
} from '@/lib/utils/touringJourney'
import {
  formatDuration,
  getLegHeight,
  layoutJourney,
} from '@/lib/utils/touringJourney'
import type { PlanJourney } from '@/lib/utils/touringPlanJourney'
import {
  formatPlanStayTime,
  TOURING_PLAN_ROUTE_TYPE_LABELS,
} from '@/lib/utils/touringPlanJourney'

type Props = {
  journey: PlanJourney
  /** 地図で強調している地点のID */
  focusedId: string | null
  /** 座標のある地点の「地図」を押したとき */
  onShowOnMap: (nodeId: string) => void
  /** 地点の編集、または未設定の出発地・目的地を決める操作 */
  onEditNode: (nodeId: string) => void
  onAddStop: (type: 'SPOT' | 'BREAK') => void
}

/** 追加ボタンを置く、目的地の手前の区間に足す高さ */
const ADD_ACTIONS_HEIGHT = 84
const EMPTY_HINT_HEIGHT = 32

function StopLabel({
  node,
  onShowOnMap,
  onEditNode,
}: Pick<Props, 'onShowOnMap' | 'onEditNode'> & { node: JourneyNode }) {
  if (node.isUnset) {
    return (
      <div className={journeyStyles.label}>
        <h3 className={`${journeyStyles.name} ${journeyStyles.nameMuted}`}>
          {node.name}
        </h3>
        <div className={styles.decide}>
          <Button
            type="button"
            variant="cloud"
            size="sm"
            className={styles.touchTarget}
            onClick={() => onEditNode(node.id)}
          >
            {node.kind === 'start' ? '出発地を決める' : '目的地を決める'}
          </Button>
        </div>
      </div>
    )
  }

  const time = formatPlanStayTime(node)

  return (
    <div className={journeyStyles.label}>
      <h3 className={journeyStyles.name}>{node.name}</h3>
      {time && <p className={styles.time}>{time}</p>}
      <div className={styles.actions}>
        {node.point && (
          <button
            type="button"
            className={journeyStyles.mapLink}
            aria-label={`${node.name}を地図で見る`}
            onClick={() => onShowOnMap(node.id)}
          >
            <MapPin size={13} aria-hidden="true" />
            地図
          </button>
        )}
        <button
          type="button"
          className={journeyStyles.mapLink}
          aria-label={`${node.name}を編集`}
          onClick={() => onEditNode(node.id)}
        >
          <Pencil size={13} aria-hidden="true" />
          編集
        </button>
      </div>
      {node.memo && <p className={journeyStyles.memo}>{node.memo}</p>}
    </div>
  )
}

function StopRow({
  row,
  isFocused,
  onShowOnMap,
  onEditNode,
}: Pick<Props, 'onShowOnMap' | 'onEditNode'> & {
  row: Extract<JourneyRow, { type: 'stop' }>
  isFocused: boolean
}) {
  return (
    <div
      data-node-id={row.node.id}
      className={`${journeyStyles.row} ${sideClass(row.side)} ${
        isFocused ? journeyStyles.focused : ''
      }`}
    >
      <div className={journeyStyles.slot}>
        <TouringStone node={row.node} />
        {row.hasTrail && <div className={journeyStyles.trail} />}
      </div>
      <StopLabel
        node={row.node}
        onShowOnMap={onShowOnMap}
        onEditNode={onEditNode}
      />
    </div>
  )
}

/** 区間の移動時間と経路。移動時間が未入力なら入れる操作を出す */
function LegActions({
  leg,
  toName,
  canEnterTravel,
  onEditNode,
}: Pick<Props, 'onEditNode'> & {
  leg: JourneyLeg
  toName: string
  canEnterTravel: boolean
}) {
  const travel =
    leg.minutes !== null
      ? [
          `移動 ${formatDuration(leg.minutes)}`,
          leg.routeType ? TOURING_PLAN_ROUTE_TYPE_LABELS[leg.routeType] : null,
        ]
          .filter((text) => text !== null)
          .join(' ・ ')
      : null

  return (
    <div className={styles.legActions}>
      {leg.minutes === null && canEnterTravel && (
        <button
          type="button"
          className={styles.enterTravel}
          aria-label={`${toName}までの移動時間を入れる`}
          onClick={() => onEditNode(leg.toId)}
        >
          移動時間を入れる
        </button>
      )}
      {leg.href ? (
        <a
          className={journeyStyles.chipLink}
          href={leg.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Googleマップで経路を開く${travel ? `（${travel}）` : ''}`}
        >
          <span className={journeyStyles.chip}>
            {travel ?? '経路'}
            <ExternalLink size={12} aria-hidden="true" />
          </span>
        </a>
      ) : (
        travel && <span className={journeyStyles.chip}>{travel}</span>
      )}
    </div>
  )
}

/**
 * ツーリングプランの道のりを飛び石で表示する
 *
 * @remarks
 * ツーリング詳細と同じ語彙で、まだ踏んでいない石として破線で置く。
 * 予定の滞在が長いほど石が大きく、予定の移動が長いほど間隔が開く。
 * 地点の追加は末尾に足すAPIなので、追加の操作は目的地の手前の区間に置く。
 */
export function TouringPlanJourney({
  journey,
  focusedId,
  onShowOnMap,
  onEditNode,
  onAddStop,
}: Props) {
  const [roadRef, width] = useElementWidth<HTMLDivElement>()
  const rows = layoutJourney(journey)
  const nodeById = new Map(journey.nodes.map((node) => [node.id, node]))
  const lastLeg = journey.legs.at(-1)
  const hasNoStops = journey.spotCount + journey.breakCount === 0

  useEffect(() => {
    if (!focusedId) return
    roadRef.current
      ?.querySelector(`[data-node-id="${CSS.escape(focusedId)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedId, roadRef])

  return (
    <div ref={roadRef} className={journeyStyles.journey}>
      {rows.map((row) => {
        if (row.type === 'stop') {
          return (
            <StopRow
              key={row.node.id}
              row={row}
              isFocused={focusedId === row.node.id}
              onShowOnMap={onShowOnMap}
              onEditNode={onEditNode}
            />
          )
        }
        if (row.type !== 'leg') return null

        const isLastLeg = row.leg === lastLeg
        const from = nodeById.get(row.leg.fromId)
        const to = nodeById.get(row.leg.toId)
        const height =
          getLegHeight(row.leg.minutes) +
          (isLastLeg ? ADD_ACTIONS_HEIGHT : 0) +
          (isLastLeg && hasNoStops ? EMPTY_HINT_HEIGHT : 0)

        return (
          <div
            key={`leg-${row.leg.fromId}`}
            className={journeyStyles.leg}
            style={{ height }}
          >
            <Road
              width={width}
              height={height}
              fromX={roadX(row.fromSide, width)}
              toX={roadX(row.toSide, width)}
            />
            <div className={journeyStyles.legCenter}>
              <LegActions
                leg={row.leg}
                toName={to?.name ?? ''}
                canEnterTravel={!from?.isUnset && !to?.isUnset}
                onEditNode={onEditNode}
              />
              {isLastLeg && hasNoStops && (
                <p className={journeyStyles.emptyText}>
                  寄りたい場所を足していきましょう
                </p>
              )}
              {isLastLeg && (
                <div className={styles.addActions}>
                  <Button
                    type="button"
                    variant="cloud"
                    size="sm"
                    className={styles.touchTarget}
                    onClick={() => onAddStop('SPOT')}
                  >
                    ＋ スポットを追加
                  </Button>
                  <Button
                    type="button"
                    variant="cloud"
                    size="sm"
                    className={styles.touchTarget}
                    onClick={() => onAddStop('BREAK')}
                  >
                    ＋ 休憩を追加
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
