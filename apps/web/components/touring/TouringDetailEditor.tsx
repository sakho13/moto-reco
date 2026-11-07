'use client'

import { Fuel, Pencil } from 'lucide-react'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { RouteTimeline } from './RouteTimeline'
import type { RouteTimelineItem } from './RouteTimeline'
import styles from './TouringDetailEditor.module.css'
import type { Journey, JourneyNode } from '@/lib/utils/touringJourney'
import { formatClock, formatStayTime } from '@/lib/utils/touringJourney'

type Props = {
  title: string
  subtitle: string
  fuelLogLabel: string
  journey: Journey
  sortableIds: string[]
  isLoadingSpots: boolean
  onFinish: () => void
  onEditTouring: () => void
  onLinkFuelLogs: () => void
  onReorder: (spotIds: string[]) => void | Promise<void>
  onEditLocation: (target: 'start' | 'end') => void
  onEditSpot: (spot: ApiResponseSpotDetail) => void
  onAddSpot: (type: 'SPOT' | 'BREAK') => void
}

const toTimelineItem = (
  node: JourneyNode,
  { onEditLocation, onEditSpot }: Pick<Props, 'onEditLocation' | 'onEditSpot'>
): RouteTimelineItem => {
  const base = {
    id: node.id,
    name: node.name,
    latitude: node.point?.lat ?? null,
    longitude: node.point?.lng ?? null,
  }
  const time = formatStayTime(node)

  if (node.kind === 'start') {
    return {
      ...base,
      type: 'START',
      primaryTime: time
        ? { label: '出発', value: null, displayValue: time }
        : null,
      onEdit: () => onEditLocation('start'),
    }
  }

  if (node.kind === 'end') {
    return {
      ...base,
      type: 'DESTINATION',
      primaryTime: time
        ? { label: '到着', value: null, displayValue: time }
        : null,
      onEdit: () => onEditLocation('end'),
    }
  }

  const spot = node.spot!
  return {
    ...base,
    type: spot.type,
    mark: node.mark,
    memo: node.memo,
    isSkipped: spot.isSkipped,
    primaryTime: spot.plannedArrivalAt
      ? { label: '予定', value: spot.plannedArrivalAt }
      : null,
    secondaryTime: spot.isSkipped
      ? spot.skippedAt
        ? {
            label: 'スキップ',
            value: null,
            displayValue: formatClock(spot.skippedAt),
          }
        : null
      : time
        ? { label: '実績', value: null, displayValue: time }
        : null,
    onEdit: () => onEditSpot(spot),
  }
}

/**
 * ツーリング詳細の編集モード
 *
 * @remarks
 * 閲覧時は思い出として読めるよう編集の操作を隠し、ここにまとめる。
 * 地点の並び替えと編集はプラン画面と同じ `RouteTimeline` を使い、保存順で並べる。
 */
export function TouringDetailEditor({
  title,
  subtitle,
  fuelLogLabel,
  journey,
  sortableIds,
  isLoadingSpots,
  onFinish,
  onEditTouring,
  onLinkFuelLogs,
  onReorder,
  onEditLocation,
  onEditSpot,
  onAddSpot,
}: Props) {
  const nodeById = new Map(journey.nodes.map((node) => [node.id, node]))
  const fixedNodes = journey.nodes.filter((node) => node.spot === null)
  const spotNodes = sortableIds
    .map((id) => nodeById.get(id))
    .filter((node): node is JourneyNode => node !== undefined)
  const items = [...fixedNodes, ...spotNodes].map((node) =>
    toTimelineItem(node, { onEditLocation, onEditSpot })
  )

  return (
    <div className={styles.editor}>
      <div className={styles.bar}>
        <p className={styles.barLabel}>編集中</p>
        <Button type="button" variant="primary" onClick={onFinish}>
          編集を終える
        </Button>
      </div>

      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.touringActions}>
          <Button type="button" variant="cloud" onClick={onEditTouring}>
            <span className={styles.buttonLabel}>
              <Pencil size={16} aria-hidden="true" />
              タイトル・日時・距離／削除
            </span>
          </Button>
          <Button type="button" variant="cloud" onClick={onLinkFuelLogs}>
            <span className={styles.buttonLabel}>
              <Fuel size={16} aria-hidden="true" />
              {fuelLogLabel}
            </span>
          </Button>
        </div>
      </div>

      <section>
        <h2 className={styles.heading}>スポット・休憩</h2>
        {isLoadingSpots ? (
          <p className={styles.loading}>読み込み中...</p>
        ) : (
          <RouteTimeline
            items={items}
            sortableIds={sortableIds}
            onReorder={onReorder}
            isScrollable={false}
            emptyMessage="スポットはまだ記録されていません"
          />
        )}
        <div className={styles.addButtons}>
          <Button
            type="button"
            variant="cloud"
            onClick={() => onAddSpot('SPOT')}
          >
            ＋ スポットを追加
          </Button>
          <Button
            type="button"
            variant="cloud"
            onClick={() => onAddSpot('BREAK')}
          >
            ＋ 休憩を追加
          </Button>
        </div>
      </section>
    </div>
  )
}
