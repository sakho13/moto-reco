'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { DragHandleIcon } from '@/components/icons/DragHandleIcon'
import { EditIcon } from '@/components/icons/EditIcon'

type SortableSpotItemProps = {
  spot: ApiResponseSpotDetail
  index: number
  editButtonClassName: string | undefined
  spotItemClassName: string | undefined
  spotBadgeClassName: string | undefined
  mutedTextClassName: string | undefined
  dimTextClassName: string | undefined
  formatVisitedAt: (dateString: string) => string
  touringStatus?: 'PLANNED' | 'STARTED' | 'COMPLETED'
  onEdit: (spot: ApiResponseSpotDetail) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

const formatBreakDuration = (
  visitedAt: string,
  endAt: string | null
): string => {
  const start = new Date(visitedAt)
  const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`

  if (!endAt) return `${startStr}〜`

  const end = new Date(endAt)
  const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`

  const diffMin = Math.round((end.getTime() - start.getTime()) / 60000)
  if (diffMin > 0) {
    return `${startStr}〜${endStr}（${diffMin}分）`
  }
  return `${startStr}〜${endStr}`
}

const formatPlannedArrival = (visitedAt: string): string => {
  const d = new Date(visitedAt)
  return `${pad(d.getHours())}:${pad(d.getMinutes())} 着予定`
}

/**
 * ドラッグ可能なスポット・休憩行コンポーネント
 */
export function SortableSpotItem({
  spot,
  index,
  editButtonClassName,
  spotItemClassName,
  spotBadgeClassName,
  mutedTextClassName,
  dimTextClassName,
  formatVisitedAt,
  touringStatus,
  onEdit,
}: SortableSpotItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: spot.spotId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isBreak = spot.type === 'BREAK'

  return (
    <div ref={setNodeRef} style={style} className={spotItemClassName}>
      <button
        {...attributes}
        {...listeners}
        className={`${editButtonClassName} cursor-grab active:cursor-grabbing shrink-0`}
        aria-label="ドラッグして並び替え"
      >
        <DragHandleIcon />
      </button>
      {isBreak ? (
        <div
          className={spotBadgeClassName}
          style={{
            background: 'var(--color-amber-400, #fbbf24)',
            color: '#fff',
          }}
        >
          休
        </div>
      ) : (
        <div className={spotBadgeClassName}>{index + 1}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">
            {isBreak ? (spot.name ?? '休憩') : (spot.name ?? '無名スポット')}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span className={dimTextClassName} style={{ fontSize: '0.75rem' }}>
              {isBreak
                ? (touringStatus === 'PLANNED' ? '予定 ' : '') +
                  formatBreakDuration(spot.visitedAt, spot.endAt)
                : spot.endAt
                  ? (touringStatus === 'PLANNED' ? '予定 ' : '') +
                    formatBreakDuration(spot.visitedAt, spot.endAt)
                  : touringStatus === 'PLANNED'
                    ? formatPlannedArrival(spot.visitedAt)
                    : formatVisitedAt(spot.visitedAt)}
            </span>
            <button
              onClick={() => onEdit(spot)}
              className={editButtonClassName}
              aria-label={isBreak ? '休憩を編集' : 'スポットを編集'}
            >
              <EditIcon />
            </button>
          </div>
        </div>
        {spot.memo && (
          <p className={`text-xs mt-1 wrap-break-word ${mutedTextClassName}`}>
            {spot.memo}
          </p>
        )}
      </div>
    </div>
  )
}
