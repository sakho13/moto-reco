'use client'

import { SpotAddForm } from './SpotAddForm'
import { ModalBase } from '@/components/common/ModalBase'

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
    <ModalBase title="スポットを追加" onClose={onClose}>
      <SpotAddForm
        bikeId={bikeId}
        touringId={touringId}
        onSuccess={onSuccess}
      />
    </ModalBase>
  )
}
