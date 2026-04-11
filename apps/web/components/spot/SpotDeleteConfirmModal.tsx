'use client'

import { Button } from '@repo/ui/button'
import { ModalBase } from '@/components/common/ModalBase'
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
    <ModalBase title="削除の確認" onClose={onCancel} size="sm">
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
    </ModalBase>
  )
}
