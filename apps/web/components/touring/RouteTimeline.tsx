'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Fragment } from 'react'
import styles from './RouteTimeline.module.css'
import { DragHandleIcon } from '@/components/icons/DragHandleIcon'
import { EditIcon } from '@/components/icons/EditIcon'

/**
 * ルートタイムラインの各項目の種別
 *
 * @remarks
 * - `START`: 出発地（先頭に固定表示）
 * - `SPOT`: 経由地
 * - `BREAK`: 休憩
 * - `DESTINATION`: 目的地（末尾に固定表示）
 */
export type RouteTimelineItemType = 'START' | 'SPOT' | 'BREAK' | 'DESTINATION'

/**
 * 時刻表示の1スロット分の情報
 *
 * @remarks
 * `value` が `null` の場合は `"{label} 未設定"` と表示する。
 */
export type RouteTimelineTimeSlot = {
  /** 表示ラベル（例: "予定", "実績", "到着予定"） */
  label: string
  /** ISO日時文字列。表示する値が無い場合は `null` */
  value: string | null
}

/**
 * ルートタイムラインの1項目分の情報
 */
export type RouteTimelineItem = {
  /** SortableのID（SPOT/BREAKはspotId、START/DESTINATIONは固定文字列でよい） */
  id: string
  /** 項目の種別 */
  type: RouteTimelineItemType
  /** 表示名 */
  name: string | null
  /** メモ */
  memo?: string | null
  /** 緯度 */
  latitude?: number | null
  /** 経度 */
  longitude?: number | null
  /** 1つ目の時刻表示スロット */
  primaryTime?: RouteTimelineTimeSlot | null
  /** 2つ目の時刻表示スロット */
  secondaryTime?: RouteTimelineTimeSlot | null
  /** スキップ済みかどうか */
  isSkipped?: boolean
  /** この地点から次の地点（経由地が無ければ目的地）へのGoogleマップ経路リンク。未設定/算出不可ならnullまたは省略 */
  travelLink?: { href: string; minutes: number | null } | null
  /** クリック/編集ボタン押下時のハンドラ。未指定なら編集ボタン非表示 */
  onEdit?: () => void
}

export type RouteTimelineProps = {
  /** タイムラインに表示する項目一覧 */
  items: RouteTimelineItem[]
  /** ドラッグ対象（SPOT/BREAKのみ）のID配列。未指定ならドラッグ機能オフ */
  sortableIds?: string[]
  /** 並び替え確定時のコールバック */
  onReorder?: (newOrderIds: string[]) => void | Promise<void>
  /** 出発地未設定時のプレースホルダラベル */
  startPlaceholderLabel?: string
  /** 目的地未設定時のプレースホルダラベル */
  destinationPlaceholderLabel?: string
  /** 出発地行クリック時（未設定時のプレースホルダ含む） */
  onStartClick?: () => void
  /** 目的地行クリック時（未設定時のプレースホルダ含む） */
  onDestinationClick?: () => void
  /** SPOT/BREAKが0件の場合に表示するメッセージ */
  emptyMessage?: string
}

const formatTimeValue = (value: string): string => {
  try {
    return new Date(value).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

/**
 * 時刻スロットを `"{label} {HH:mm}"` 形式に整形する
 *
 * @remarks
 * `slot` が `null`/`undefined` の場合は非表示（`null`を返す）。
 * `slot.value` が `null` の場合は `"{label} 未設定"` を返す。
 */
const formatTimeSlot = (
  slot: RouteTimelineTimeSlot | null | undefined
): string | null => {
  if (!slot) return null
  if (slot.value === null) return `${slot.label} 未設定`
  return `${slot.label} ${formatTimeValue(slot.value)}`
}

type TimelineRowProps = {
  item: RouteTimelineItem
  badge: React.ReactNode
  dragHandle?: React.ReactNode
}

/**
 * タイムライン1行分の共通レイアウト
 */
function TimelineRow({ item, badge, dragHandle }: TimelineRowProps) {
  const primaryLabel = formatTimeSlot(item.primaryTime)
  const secondaryLabel = formatTimeSlot(item.secondaryTime)
  const hasTime = primaryLabel !== null || secondaryLabel !== null

  const handleEdit = item.onEdit

  return (
    <div className={styles.spotItem}>
      {dragHandle}
      {badge}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {item.name ?? (item.type === 'BREAK' ? '休憩' : '無名スポット')}
            </p>
            {item.isSkipped && (
              <span className={styles.skippedBadge}>スキップ</span>
            )}
          </div>
          {handleEdit && (
            <button
              onClick={handleEdit}
              className={styles.editButton}
              aria-label="編集"
            >
              <EditIcon />
            </button>
          )}
        </div>
        {hasTime ? (
          <div className={`${styles.timeRow} ${styles.dimText}`}>
            {primaryLabel && <span>{primaryLabel}</span>}
            {primaryLabel && secondaryLabel && <span>·</span>}
            {secondaryLabel && <span>{secondaryLabel}</span>}
          </div>
        ) : null}
        {item.memo && (
          <p className={`text-xs mt-1 wrap-break-word ${styles.mutedText}`}>
            {item.memo}
          </p>
        )}
      </div>
    </div>
  )
}

type SortableTimelineRowProps = {
  item: RouteTimelineItem
  badge: React.ReactNode
}

/**
 * ドラッグ並び替え可能なタイムライン行（SPOT/BREAK用）
 */
function SortableTimelineRow({ item, badge }: SortableTimelineRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TimelineRow
        item={item}
        badge={badge}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className={`${styles.editButton} cursor-grab active:cursor-grabbing shrink-0`}
            aria-label="ドラッグして並び替え"
          >
            <DragHandleIcon />
          </button>
        }
      />
    </div>
  )
}

type PlaceholderRowProps = {
  label: string
  badgeClassName: string
  badgeLabel: string
  onClick?: () => void
}

/**
 * 出発地・目的地が未設定の場合に表示するプレースホルダ行
 */
function PlaceholderRow({
  label,
  badgeClassName,
  badgeLabel,
  onClick,
}: PlaceholderRowProps) {
  return (
    <div
      className={styles.placeholderItem}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className={badgeClassName}>{badgeLabel}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${styles.mutedText}`}>{label}</p>
      </div>
    </div>
  )
}

type FixedRowProps = {
  item: RouteTimelineItem
  badgeClassName: string
  badgeLabel: string
}

/**
 * 出発地・目的地の固定行
 */
function FixedRow({ item, badgeClassName, badgeLabel }: FixedRowProps) {
  const badge = <div className={badgeClassName}>{badgeLabel}</div>
  return <TimelineRow item={item} badge={badge} />
}

type TravelLinkRowProps = {
  travelLink: { href: string; minutes: number | null } | null | undefined
}

/**
 * 地点間のGoogleマップ経路リンクを表示する行
 */
function TravelLinkRow({ travelLink }: TravelLinkRowProps) {
  if (!travelLink) return null
  return (
    <a
      href={travelLink.href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.travelLink}
    >
      ↓ Googleマップで経路を表示
      {travelLink.minutes !== null ? `（移動 ${travelLink.minutes}分）` : ''}
    </a>
  )
}

/**
 * 出発地🏁→経由地📍/休憩☕→目的地🏁を縦の時系列ラインで表示する汎用UIコンポーネント
 *
 * @remarks
 * プラン管理画面・ツーリング詳細画面の両方で使用する基盤コンポーネント。
 * 各項目の `travelLink` を設定すると、出発地・各経由地/休憩行の直後に
 * Googleマップ経路リンクが表示される。
 */
export function RouteTimeline({
  items,
  sortableIds,
  onReorder,
  startPlaceholderLabel = '出発地を設定',
  destinationPlaceholderLabel = '目的地を設定',
  onStartClick,
  onDestinationClick,
  emptyMessage = '経由地はまだ登録されていません',
}: RouteTimelineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  const startItem = items.find((item) => item.type === 'START') ?? null
  const destinationItem =
    items.find((item) => item.type === 'DESTINATION') ?? null
  const middleItems = items.filter(
    (item) => item.type === 'SPOT' || item.type === 'BREAK'
  )

  const draggable = onReorder !== undefined
  const ids = sortableIds ?? []

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !onReorder) return

    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(ids, oldIndex, newIndex)
    void onReorder(reordered)
  }

  let spotIndex = 0

  const middleContent = (
    <div className="space-y-3">
      {middleItems.length === 0 && (
        <p className={`text-sm ${styles.mutedText}`}>{emptyMessage}</p>
      )}
      {middleItems.map((item) => {
        const isBreak = item.type === 'BREAK'
        const badge = isBreak ? (
          <div className={styles.breakBadge}>休</div>
        ) : (
          <div className={styles.spotBadge}>{++spotIndex}</div>
        )

        return (
          <Fragment key={item.id}>
            {draggable ? (
              <SortableTimelineRow item={item} badge={badge} />
            ) : (
              <TimelineRow item={item} badge={badge} />
            )}
            <TravelLinkRow travelLink={item.travelLink} />
          </Fragment>
        )
      })}
    </div>
  )

  return (
    <div className={styles.spotsListScroll}>
      <div className="space-y-3">
        {startItem ? (
          <FixedRow
            item={startItem}
            badgeClassName={styles.startBadge}
            badgeLabel="出"
          />
        ) : onStartClick ? (
          <PlaceholderRow
            label={startPlaceholderLabel}
            badgeClassName={styles.startBadge}
            badgeLabel="出"
            onClick={onStartClick}
          />
        ) : null}
        <TravelLinkRow travelLink={startItem?.travelLink} />

        {draggable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {middleContent}
            </SortableContext>
          </DndContext>
        ) : (
          middleContent
        )}

        {destinationItem ? (
          <FixedRow
            item={destinationItem}
            badgeClassName={styles.endBadge}
            badgeLabel="着"
          />
        ) : onDestinationClick ? (
          <PlaceholderRow
            label={destinationPlaceholderLabel}
            badgeClassName={styles.endBadge}
            badgeLabel="着"
            onClick={onDestinationClick}
          />
        ) : null}
      </div>
    </div>
  )
}
