'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { SpotDeleteConfirmModal } from '@/components/spot/SpotDeleteConfirmModal'
import { apiDelete, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

interface SpotEditFormProps {
  bikeId: string
  touringId: string
  spot: ApiResponseSpotDetail
  onSuccess: () => void
  onDelete?: () => void
}

type SpotFormState = {
  name: string
  memo: string
  visitedAt: string
  endAt: string
}

const toLocalDateTimeString = (dateString: string) => {
  const d = new Date(dateString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * スポット・休憩編集フォーム
 */
export function SpotEditForm({
  bikeId,
  touringId,
  spot,
  onSuccess,
  onDelete,
}: SpotEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [error, setError] = useState('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [formState, setFormState] = useState<SpotFormState>({
    name: '',
    memo: '',
    visitedAt: '',
    endAt: '',
  })

  const isBreak = spot.type === 'BREAK'
  const label = isBreak ? '休憩' : 'スポット'

  useEffect(() => {
    setFormState({
      name: spot.name ?? '',
      memo: spot.memo ?? '',
      visitedAt: toLocalDateTimeString(spot.visitedAt),
      endAt: spot.endAt ? toLocalDateTimeString(spot.endAt) : '',
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

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await apiDelete(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots/${spot.spotId}`
      )
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      toast.success(`${label}を削除しました`)
      onDelete?.()
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error ? err.message : `${label}の削除に失敗しました`
      )
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
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
          endAt: isBreak
            ? formState.endAt !== ''
              ? new Date(formState.endAt)
              : null
            : undefined,
        }
      )

      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      toast.success(`${label}を更新しました`)
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
        <FormField label={isBreak ? '場所名' : 'スポット名'} htmlFor="spotName">
          <Input
            id="spotName"
            type="text"
            value={formState.name}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, name: e.target.value }))
            }
            maxLength={100}
            placeholder={isBreak ? '場所名（任意）' : 'スポット名（任意）'}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="メモ" htmlFor="spotMemo">
          <Textarea
            id="spotMemo"
            value={formState.memo}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, memo: e.target.value }))
            }
            maxLength={500}
            rows={3}
            placeholder="メモ（任意）"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label={isBreak ? '休憩開始' : '訪問日時'}
          htmlFor="spotVisitedAt"
        >
          <Input
            id="spotVisitedAt"
            type="datetime-local"
            value={formState.visitedAt}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, visitedAt: e.target.value }))
            }
            disabled={isSubmitting}
          />
        </FormField>

        {isBreak && (
          <FormField label="休憩終了（任意）" htmlFor="spotEndAt">
            <Input
              id="spotEndAt"
              type="datetime-local"
              value={formState.endAt}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, endAt: e.target.value }))
              }
              disabled={isSubmitting}
            />
          </FormField>
        )}

        <FormField label="位置">
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-60 flex-1">
              {currentLocation
                ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`
                : '未設定'}
            </p>
            <Button
              type="button"
              variant="cloud"
              size="sm"
              onClick={() => setIsLocationModalOpen(true)}
            >
              地図で変更
            </Button>
          </div>
        </FormField>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          fullWidth
          loading={isSubmitting}
        >
          更新する
        </Button>

        {onDelete && (
          <Button
            type="button"
            variant="danger"
            fullWidth
            disabled={isDeleting}
            loading={isDeleting}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            削除する
          </Button>
        )}
      </form>

      {isDeleteModalOpen && (
        <SpotDeleteConfirmModal
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

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
