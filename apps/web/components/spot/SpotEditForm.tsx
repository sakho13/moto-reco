'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { toast } from '@repo/ui/sonner'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

interface SpotEditFormProps {
  bikeId: string
  touringId: string
  spot: ApiResponseSpotDetail
  onSuccess: () => void
}

type SpotFormState = {
  name: string
  memo: string
  visitedAt: string
}

/**
 * スポット編集フォーム
 */
export function SpotEditForm({
  bikeId,
  touringId,
  spot,
  onSuccess,
}: SpotEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [error, setError] = useState('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [formState, setFormState] = useState<SpotFormState>({
    name: '',
    memo: '',
    visitedAt: '',
  })

  useEffect(() => {
    const visitedAtLocal = new Date(spot.visitedAt)
    const pad = (n: number) => String(n).padStart(2, '0')
    const visitedAtStr = `${visitedAtLocal.getFullYear()}-${pad(visitedAtLocal.getMonth() + 1)}-${pad(visitedAtLocal.getDate())}T${pad(visitedAtLocal.getHours())}:${pad(visitedAtLocal.getMinutes())}`

    setFormState({
      name: spot.name ?? '',
      memo: spot.memo ?? '',
      visitedAt: visitedAtStr,
    })

    if (spot.latitude != null && spot.longitude != null) {
      setCurrentLocation({ lat: spot.latitude, lng: spot.longitude })
    }
  }, [spot])

  const handleLocationSaved = async (lat: number, lng: number) => {
    if (isSavingLocation) return
    setIsSavingLocation(true)

    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots/${spot.spotId}`,
        { latitude: lat, longitude: lng }
      )
      setCurrentLocation({ lat, lng })
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      toast.success('位置を更新しました')
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error ? err.message : '位置の保存に失敗しました'
      )
    } finally {
      setIsSavingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots/${spot.spotId}`,
        {
          name: formState.name !== '' ? formState.name : null,
          memo: formState.memo !== '' ? formState.memo : null,
          visitedAt: new Date(formState.visitedAt),
        }
      )

      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      toast.success('スポットを更新しました')
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">スポット名</label>
          <input
            type="text"
            value={formState.name}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, name: e.target.value }))
            }
            maxLength={100}
            placeholder="スポット名（任意）"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">メモ</label>
          <textarea
            value={formState.memo}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, memo: e.target.value }))
            }
            maxLength={500}
            rows={3}
            placeholder="メモ（任意）"
            className="w-full border rounded px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">訪問日時</label>
          <input
            type="datetime-local"
            value={formState.visitedAt}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, visitedAt: e.target.value }))
            }
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">位置</label>
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-60 flex-1">
              {currentLocation
                ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                : '未設定'}
            </p>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="text-xs border rounded px-2 py-1"
            >
              地図で変更
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting ? '更新中...' : '更新する'}
        </button>
      </form>

      {isLocationModalOpen && (
        <LocationPickerModal
          title="位置を設定"
          initialLocation={currentLocation}
          isSaving={isSavingLocation}
          onLocationSaved={handleLocationSaved}
          onClose={() => setIsLocationModalOpen(false)}
        />
      )}
    </>
  )
}
