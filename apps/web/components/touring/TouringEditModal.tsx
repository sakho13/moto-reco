'use client'

import { TouringEditForm } from './TouringEditForm'
import styles from './TouringEditModal.module.css'
import { XIcon } from '@/components/icons/XIcon'

interface TouringEditModalProps {
  bikeId: string
  touringId: string
  onClose: () => void
  onSuccess: (action: 'update' | 'delete') => void
}

export function TouringEditModal({
  bikeId,
  touringId,
  onClose,
  onSuccess,
}: TouringEditModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className="text-lg font-semibold">ツーリング履歴を編集</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </button>
        </div>
        <TouringEditForm
          bikeId={bikeId}
          touringId={touringId}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  )
}
