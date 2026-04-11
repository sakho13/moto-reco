'use client'

import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { SpotEditForm } from './SpotEditForm'
import { ModalBase } from '@/components/common/ModalBase'

interface SpotEditModalProps {
  bikeId: string
  touringId: string
  spot: ApiResponseSpotDetail
  onClose: () => void
  onSuccess: () => void
  onDelete?: () => void
}

/**
 * スポット編集モーダル
 */
export function SpotEditModal({
  bikeId,
  touringId,
  spot,
  onClose,
  onSuccess,
  onDelete,
}: SpotEditModalProps) {
  return (
    <ModalBase title="スポットを編集" onClose={onClose}>
      <SpotEditForm
        bikeId={bikeId}
        touringId={touringId}
        spot={spot}
        onSuccess={onSuccess}
        onDelete={onDelete}
      />
    </ModalBase>
  )
}
