'use client'

import { Button } from '@repo/ui/button'
import styles from './TouringDeleteConfirmModal.module.css'
import { ModalBase } from '@/components/common/ModalBase'

interface TouringDeleteConfirmModalProps {
  onCancel: () => void
  onConfirm: () => void
}

export function TouringDeleteConfirmModal({
  onCancel,
  onConfirm,
}: TouringDeleteConfirmModalProps) {
  return (
    <ModalBase title="削除の確認" onClose={onCancel} size="sm">
      <p className={styles.message}>
        このツーリング履歴を削除しますか？この操作は取り消せません。
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
