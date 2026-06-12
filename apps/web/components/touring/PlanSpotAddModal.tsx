'use client'

import { PlanSpotAddForm } from './PlanSpotAddForm'
import { ModalBase } from '@/components/common/ModalBase'

type PlanSpotAddModalProps = {
  bikeId: string
  planId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * ツーリングプランの経由地・休憩追加モーダル
 */
export function PlanSpotAddModal({
  bikeId,
  planId,
  initialType = 'SPOT',
  initialLocation = null,
  onClose,
  onSuccess,
}: PlanSpotAddModalProps) {
  const title = initialType === 'BREAK' ? '休憩を追加' : 'スポットを追加'

  return (
    <ModalBase title={title} onClose={onClose}>
      <PlanSpotAddForm
        bikeId={bikeId}
        planId={planId}
        initialType={initialType}
        initialLocation={initialLocation}
        onSuccess={onSuccess}
      />
    </ModalBase>
  )
}
