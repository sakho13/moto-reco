'use client'

import { SpotAddForm } from './SpotAddForm'
import { XIcon } from '@/components/icons/XIcon'
import styles from '@/components/touring/TouringEditModal.module.css'

type SpotAddModalProps = {
  bikeId: string
  touringId: string
  onClose: () => void
  onSuccess: () => void
}

/**
 * スポット追加モーダル
 */
export function SpotAddModal({
  bikeId,
  touringId,
  onClose,
  onSuccess,
}: SpotAddModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className="text-lg font-semibold">スポットを追加</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </button>
        </div>
        <SpotAddForm
          bikeId={bikeId}
          touringId={touringId}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  )
}
