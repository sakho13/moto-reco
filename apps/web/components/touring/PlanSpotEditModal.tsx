'use client'

import type { ApiResponseTouringPlanSpotDetail } from '@repo/shared-types'
import { PlanSpotEditForm } from './PlanSpotEditForm'
import { ModalBase } from '@/components/common/ModalBase'

interface PlanSpotEditModalProps {
  bikeId: string
  planId: string
  spot: ApiResponseTouringPlanSpotDetail
  /** 前の地点（編集対象スポットの直前のスポット、無ければ出発地）の位置情報。経路確認リンクの算出に使う */
  prevLocation?: { lat: number; lng: number } | null
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
  prevLocation = null,
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
        prevLocation={prevLocation}
        onSuccess={onSuccess}
        onDelete={onDelete}
      />
    </ModalBase>
  )
}
