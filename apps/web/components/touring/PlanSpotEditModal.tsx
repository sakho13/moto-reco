'use client'

import type { ApiResponseTouringPlanSpotDetail } from '@repo/shared-types'
import { PlanSpotEditForm } from './PlanSpotEditForm'
import { ModalBase } from '@/components/common/ModalBase'

interface PlanSpotEditModalProps {
  bikeId: string
  planId: string
  spot: ApiResponseTouringPlanSpotDetail
  onClose: () => void
  onSuccess: () => void
  onDelete?: () => void
}

/**
 * ツーリングプランの経由地・休憩編集モーダル
 */
export function PlanSpotEditModal({
  bikeId,
  planId,
  spot,
  onClose,
  onSuccess,
  onDelete,
}: PlanSpotEditModalProps) {
  const title = spot.type === 'BREAK' ? '休憩を編集' : 'スポットを編集'

  return (
    <ModalBase title={title} onClose={onClose}>
      <PlanSpotEditForm
        bikeId={bikeId}
        planId={planId}
        spot={spot}
        onSuccess={onSuccess}
        onDelete={onDelete}
      />
    </ModalBase>
  )
}
