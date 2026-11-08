'use client'

import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { SpotEditForm } from './SpotEditForm'
import { ModalBase } from '@/components/common/ModalBase'

interface SpotEditModalProps {
  bikeId: string
  touringId: string
  spot: ApiResponseSpotDetail
  /** 写真欄を出すか */
  showsPhotos?: boolean
  onClose: () => void
  onSuccess: () => void
  onDelete?: () => void
}

/**
 * スポット・休憩編集モーダル
 */
export function SpotEditModal({
  bikeId,
  touringId,
  spot,
  showsPhotos = false,
  onClose,
  onSuccess,
  onDelete,
}: SpotEditModalProps) {
  const title = spot.type === 'BREAK' ? '休憩を編集' : 'スポットを編集'

  return (
    <ModalBase title={title} onClose={onClose}>
      <SpotEditForm
        bikeId={bikeId}
        touringId={touringId}
        spot={spot}
        showsPhotos={showsPhotos}
        onSuccess={onSuccess}
        onDelete={onDelete}
      />
    </ModalBase>
  )
}
