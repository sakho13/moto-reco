'use client'

import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { SpotEditForm } from './SpotEditForm'
import { XIcon } from '@/components/icons/XIcon'
import styles from '@/components/touring/TouringEditModal.module.css'

interface SpotEditModalProps {
  bikeId: string
  touringId: string
  spot: ApiResponseSpotDetail
  onClose: () => void
  onSuccess: () => void
  onDelete?: () => void
}

/**
 * スポット編集モーダル
 */
export function SpotEditModal({
  bikeId,
  touringId,
  spot,
  onClose,
  onSuccess,
  onDelete,
}: SpotEditModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className="text-lg font-semibold">スポットを編集</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </button>
        </div>
        <SpotEditForm
          bikeId={bikeId}
          touringId={touringId}
          spot={spot}
          onSuccess={onSuccess}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
