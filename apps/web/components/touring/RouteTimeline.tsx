'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { Announcements, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@repo/ui/button'
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
 * `displayValue` が指定されている場合はそれを優先して表示する。
 * 未指定の場合、`value` が `null` なら `"{label} 未設定"`、
 * それ以外は `value`（ISO日時文字列）を `HH:mm` 形式に整形して表示する。
 */
export type RouteTimelineTimeSlot = {
  /** 表示ラベル（例: "予定", "実績", "到着予定"） */
  label: string
  /** ISO日時文字列。表示する値が無い場合は `null` */
  value: string | null
  /**
   * 表示用に整形済みの値。指定された場合は `value` を無視してそのまま表示する。
   *
   * @remarks
   * ツーリングプラン（経過分数ベース）など、`value` のISO日時パースが
   * 適さない場合に使用する。
   */
  displayValue?: string
}

/**
 * ルートタイムラインの1項目分の情報
 */
export type RouteTimelineItem = {
  /** SortableのID（SPOT/BREAKはspotId、START/DESTINATIONは固定文字列でよい） */
  id: string
  /** 項目の種別 */
  type: RouteTimelineItemType
  /** バッジに出す印。未指定のSPOTは先頭からの連番になる */
  mark?: string
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
  /** SPOT/BREAKが0件の場合に表示するメッセージ */
  emptyMessage?: string
  /** PC幅で一覧の内側をスクロールさせるか。地図と並べないときはfalseにする */
  isScrollable?: boolean
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
 * `slot.displayValue` が指定されている場合はそれをそのまま使う。
 * 未指定の場合、`slot.value` が `null` なら `"{label} 未設定"` を返し、
 * それ以外は `slot.value`（ISO日時文字列）を`HH:mm`整形して返す。
 */
const formatTimeSlot = (
  slot: RouteTimelineTimeSlot | null | undefined
): string | null => {
  if (!slot) return null
  if (slot.displayValue !== undefined)
    return `${slot.label} ${slot.displayValue}`
  if (slot.value === null) return `${slot.label} 未設定`
  return `${slot.label} ${formatTimeValue(slot.value)}`
}

const getItemName = (item: RouteTimelineItem): string =>
  item.name ?? (item.type === 'BREAK' ? '休憩' : '無名スポット')

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
            <p className="font-medium text-sm truncate">{getItemName(item)}</p>
            {item.isSkipped && (
              <span className={styles.skippedBadge}>スキップ</span>
            )}
          </div>
          {handleEdit && (
            <Button
              type="button"
              variant="quiet"
              size="iconSm"
              onClick={handleEdit}
              className={styles.editButton}
              aria-label="編集"
            >
              <EditIcon />
            </Button>
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
  } = useSortable({
    id: item.id,
    attributes: { roleDescription: '並び替えできる地点' },
  })

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
            className={`${styles.dragHandle} cursor-grab active:cursor-grabbing shrink-0`}
            aria-label={`${getItemName(item)}をドラッグして並び替え`}
          >
            <DragHandleIcon />
          </button>
        }
      />
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

/**
 * 出発地🏁→経由地📍/休憩☕→目的地🏁を縦の時系列ラインで表示する汎用UIコンポーネント
 *
 * @remarks
 * プラン画面の並び替えとツーリング詳細の編集モードで使用する基盤コンポーネント。
 */
export function RouteTimeline({
  items,
  sortableIds,
  onReorder,
  emptyMessage = '経由地はまだ登録されていません',
  isScrollable = true,
}: RouteTimelineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const nameOf = (id: string | number): string =>
    middleItems.find((item) => item.id === id)?.name ?? '地点'
  const positionOf = (id: string | number): number =>
    ids.indexOf(String(id)) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${nameOf(active.id)}を持ち上げました`,
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id
        ? `${nameOf(active.id)}を${positionOf(over.id)}番目へ移動します`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)}を${positionOf(over.id)}番目に置きました`
        : `${nameOf(active.id)}を元の位置に戻しました`,
    onDragCancel: ({ active }) => `${nameOf(active.id)}の移動を取り消しました`,
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
          <div className={styles.spotBadge}>{item.mark ?? ++spotIndex}</div>
        )

        return draggable ? (
          <SortableTimelineRow key={item.id} item={item} badge={badge} />
        ) : (
          <TimelineRow key={item.id} item={item} badge={badge} />
        )
      })}
    </div>
  )

  return (
    <div className={isScrollable ? styles.spotsListScroll : undefined}>
      <div className="space-y-3">
        {startItem && (
          <FixedRow
            item={startItem}
            badgeClassName={styles.startBadge}
            badgeLabel="出"
          />
        )}

        {draggable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={{
              announcements,
              screenReaderInstructions: {
                draggable:
                  'スペースキーで持ち上げ、上下の矢印キーで移動し、スペースキーで置きます。Escapeキーで取り消せます。',
              },
            }}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {middleContent}
            </SortableContext>
          </DndContext>
        ) : (
          middleContent
        )}

        {destinationItem && (
          <FixedRow
            item={destinationItem}
            badgeClassName={styles.endBadge}
            badgeLabel="着"
          />
        )}
      </div>
    </div>
  )
}
