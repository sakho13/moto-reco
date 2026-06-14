'use client'

import { PlanSpotAddForm } from './PlanSpotAddForm'
import { ModalBase } from '@/components/common/ModalBase'

type PlanSpotAddModalProps = {
  bikeId: string
  planId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  /** 前の地点（最後の経由地、無ければ出発地）の位置情報。経路確認リンクの算出に使う */
  prevLocation?: { lat: number; lng: number } | null
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
  prevLocation = null,
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
        prevLocation={prevLocation}
        onSuccess={onSuccess}
      />
    </ModalBase>
  )
}
