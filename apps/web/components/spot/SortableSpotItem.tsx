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
  onEdit: (spot: ApiResponseSpotDetail) => void
}

/**
 * ドラッグ可能なスポット行コンポーネント
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
      <div className={spotBadgeClassName}>{index + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">
            {spot.name ?? '無名スポット'}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span className={dimTextClassName} style={{ fontSize: '0.75rem' }}>
              {formatVisitedAt(spot.visitedAt)}
            </span>
            <button
              onClick={() => onEdit(spot)}
              className={editButtonClassName}
              aria-label="スポットを編集"
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
