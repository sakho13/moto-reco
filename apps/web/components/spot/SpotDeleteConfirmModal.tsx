'use client'

import { Button } from '@repo/ui/button'
import { XIcon } from '@/components/icons/XIcon'
import styles from '@/components/touring/TouringDeleteConfirmModal.module.css'

type SpotDeleteConfirmModalProps = {
  onCancel: () => void
  onConfirm: () => void
}

/**
 * スポット削除確認モーダル
 */
export function SpotDeleteConfirmModal({
  onCancel,
  onConfirm,
}: SpotDeleteConfirmModalProps) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className="text-lg font-semibold">削除の確認</h2>
          <button
            onClick={onCancel}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </button>
        </div>
        <p className={styles.message}>
          このスポットを削除しますか？この操作は取り消せません。
        </p>
        <div className={styles.actions}>
          <Button onClick={onCancel} variant="cloud">
            キャンセル
          </Button>
          <Button onClick={onConfirm} variant="danger">
            削除
          </Button>
        </div>
      </div>
    </div>
  )
}
