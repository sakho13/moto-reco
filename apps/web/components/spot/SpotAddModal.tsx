'use client'

import { SpotAddForm } from './SpotAddForm'
import { ModalBase } from '@/components/common/ModalBase'

type SpotAddModalProps = {
  bikeId: string
  touringId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  touringStatus?: 'PLANNED' | 'STARTED' | 'COMPLETED'
  prevSpotVisitedAt?: string
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
  touringStatus,
  prevSpotVisitedAt,
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
        touringStatus={touringStatus}
        prevSpotVisitedAt={prevSpotVisitedAt}
        onSuccess={onSuccess}
      />
    </ModalBase>
  )
}
