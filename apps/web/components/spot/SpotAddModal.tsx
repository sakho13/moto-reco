'use client'

import { SpotAddForm } from './SpotAddForm'
import { ModalBase } from '@/components/common/ModalBase'

type SpotAddModalProps = {
  bikeId: string
  touringId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  prevSpotDepartedAt?: string
  onClose: () => void
  onSuccess: () => void
}

/**
 * スポット・休憩追加モーダル
 */
export function SpotAddModal({
  bikeId,
  touringId,
  initialType = 'SPOT',
  initialLocation = null,
  prevSpotDepartedAt,
  onClose,
  onSuccess,
}: SpotAddModalProps) {
  const title = initialType === 'BREAK' ? '休憩を追加' : 'スポットを追加'

  return (
    <ModalBase title={title} onClose={onClose}>
      <SpotAddForm
        bikeId={bikeId}
        touringId={touringId}
        initialType={initialType}
        initialLocation={initialLocation}
        prevSpotDepartedAt={prevSpotDepartedAt}
        onSuccess={onSuccess}
      />
    </ModalBase>
  )
}
