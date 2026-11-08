'use client'

import { Button } from '@repo/ui/button'
import { ModalBase } from '@/components/common/ModalBase'
import styles from '@/components/touring/TouringDeleteConfirmModal.module.css'

type Props = {
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 写真の削除確認モーダル
 */
export function PhotoDeleteConfirmModal({ onCancel, onConfirm }: Props) {
  return (
    <ModalBase title="写真の削除" onClose={onCancel} size="sm">
      <p className={styles.message}>
        この写真を削除しますか？この操作は取り消せません。
      </p>
      <div className={styles.actions}>
        <Button type="button" onClick={onCancel} variant="cloud">
          キャンセル
        </Button>
        <Button type="button" onClick={onConfirm} variant="danger">
          削除
        </Button>
      </div>
    </ModalBase>
  )
}
