'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { SpotDeleteConfirmModal } from '@/components/spot/SpotDeleteConfirmModal'
import { apiDelete, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { toLocalDateTimeString } from '@repo/shared-utils'

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
  arrivedAt: string
  departedAt: string
}

/**
 * スポット・休憩編集フォーム
 *
 * @remarks
 * 実績記録専用フォーム。到着日時(`arrivedAt`)・出発日時(`departedAt`)を編集する。
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
    arrivedAt: '',
    departedAt: '',
  })

  const isBreak = spot.type === 'BREAK'
  const label = isBreak ? '休憩' : 'スポット'

  const computedStayMinutes = (() => {
    if (!formState.arrivedAt || !formState.departedAt) return null
    const diff = Math.round(
      (new Date(formState.departedAt).getTime() -
        new Date(formState.arrivedAt).getTime()) /
        60000
    )
    return diff > 0 ? diff : null
  })()

  useEffect(() => {
    setFormState({
      name: spot.name ?? '',
      memo: spot.memo ?? '',
      arrivedAt: spot.arrivedAt ? toLocalDateTimeString(spot.arrivedAt) : '',
      departedAt: spot.departedAt ? toLocalDateTimeString(spot.departedAt) : '',
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
          arrivedAt:
            formState.arrivedAt !== '' ? new Date(formState.arrivedAt) : null,
          departedAt:
            formState.departedAt !== '' ? new Date(formState.departedAt) : null,
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
          htmlFor="spotArrivedAt"
        >
          <DateTimeInput
            id="spotArrivedAt"
            value={formState.arrivedAt}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, arrivedAt: e.target.value }))
            }
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          label={isBreak ? '休憩終了（任意）' : '出発時間（任意）'}
          htmlFor="spotDepartedAt"
        >
          <DateTimeInput
            id="spotDepartedAt"
            value={formState.departedAt}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                departedAt: e.target.value,
              }))
            }
            disabled={isSubmitting}
          />
          {computedStayMinutes !== null && (
            <p className="text-xs opacity-50 mt-1 text-right">
              滞在: {computedStayMinutes}分
            </p>
          )}
        </FormField>

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
