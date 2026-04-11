'use client'

import { TouringEditForm } from './TouringEditForm'
import { ModalBase } from '@/components/common/ModalBase'

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
    <ModalBase title="ツーリング履歴を編集" onClose={onClose}>
      <TouringEditForm
        bikeId={bikeId}
        touringId={touringId}
        onSuccess={onSuccess}
      />
    </ModalBase>
  )
}
