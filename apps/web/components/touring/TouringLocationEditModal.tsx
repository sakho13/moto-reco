'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import { toast } from '@repo/ui/sonner'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPatch } from '@/lib/api/client'

type LocationType = 'start' | 'end'

interface TouringLocationEditModalProps {
  bikeId: string
  touringId: string
  type: LocationType
  initialLocation: { lat: number; lng: number } | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * ツーリング開始・終了位置の編集モーダル。マップクリックで即時保存する。
 */
export function TouringLocationEditModal({
  bikeId,
  touringId,
  type,
  initialLocation,
  onClose,
  onSuccess,
}: TouringLocationEditModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  const title = type === 'start' ? '出発地を設定' : '終着地を設定'

  const handleLocationSaved = async (lat: number, lng: number) => {
    if (isSaving) return
    setIsSaving(true)

    const body =
      type === 'start'
        ? { startLatitude: lat, startLongitude: lng }
        : { endLatitude: lat, endLongitude: lng }

    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`,
        body
      )
      await mutate(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`)
      toast.success(`${type === 'start' ? '出発地' : '終着地'}を更新しました`)
      onSuccess()
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error ? err.message : '保存に失敗しました'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <LocationPickerModal
      title={title}
      initialLocation={initialLocation}
      isSaving={isSaving}
      onLocationSaved={handleLocationSaved}
      onClose={onClose}
    />
  )
}
