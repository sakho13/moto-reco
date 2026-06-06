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
import { toLocalDateTimeString } from '@/lib/utils/dateUtils'

interface SpotEditFormProps {
  bikeId: string
  touringId: string
  spot: ApiResponseSpotDetail
  touringStatus?: 'PLANNED' | 'STARTED' | 'COMPLETED'
  onSuccess: () => void
  onDelete?: () => void
}

type SpotFormState = {
  name: string
  memo: string
  visitedAt: string
  endAt: string
  stayMinutes: string
}

/**
 * スポット・休憩編集フォーム
 */
export function SpotEditForm({
  bikeId,
  touringId,
  spot,
  touringStatus,
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
    stayMinutes: '',
  })

  const isBreak = spot.type === 'BREAK'
  const isPlanned = touringStatus === 'PLANNED'
  const label = isBreak ? '休憩' : 'スポット'

  const computedStayMinutes = (() => {
    if (!formState.visitedAt || !formState.endAt) return null
    const diff = Math.round(
      (new Date(formState.endAt).getTime() -
        new Date(formState.visitedAt).getTime()) /
        60000
    )
    return diff > 0 ? diff : null
  })()

  const plannedDepartureTime = (() => {
    if (!isPlanned || !formState.visitedAt || !formState.stayMinutes)
      return null
    const minutes = parseInt(formState.stayMinutes, 10)
    if (isNaN(minutes) || minutes <= 0) return null
    const date = new Date(formState.visitedAt)
    date.setMinutes(date.getMinutes() + minutes)
    return date
  })()

  useEffect(() => {
    const initialStayMinutes = (() => {
      if (!spot.visitedAt || !spot.endAt) return ''
      const diff = Math.round(
        (new Date(spot.endAt).getTime() - new Date(spot.visitedAt).getTime()) /
          60000
      )
      return diff > 0 ? String(diff) : ''
    })()

    setFormState({
      name: spot.name ?? '',
      memo: spot.memo ?? '',
      visitedAt: spot.visitedAt ? toLocalDateTimeString(spot.visitedAt) : '',
      endAt: spot.endAt ? toLocalDateTimeString(spot.endAt) : '',
      stayMinutes: initialStayMinutes,
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

    const endAt = (() => {
      if (isPlanned) {
        if (!formState.stayMinutes || !formState.visitedAt) return null
        const minutes = parseInt(formState.stayMinutes, 10)
        if (isNaN(minutes) || minutes <= 0) return null
        const date = new Date(formState.visitedAt)
        date.setMinutes(date.getMinutes() + minutes)
        return date
      }
      return formState.endAt !== '' ? new Date(formState.endAt) : null
    })()

    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots/${spot.spotId}`,
        {
          name: formState.name !== '' ? formState.name : null,
          memo: formState.memo !== '' ? formState.memo : null,
          visitedAt: new Date(formState.visitedAt),
          endAt,
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
          label={
            isBreak
              ? isPlanned
                ? '休憩開始予定'
                : '休憩開始'
              : isPlanned
                ? '到着予定'
                : '訪問日時'
          }
          htmlFor="spotVisitedAt"
        >
          <DateTimeInput
            id="spotVisitedAt"
            value={formState.visitedAt}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, visitedAt: e.target.value }))
            }
            disabled={isSubmitting}
          />
        </FormField>

        {isPlanned ? (
          <FormField
            label={isBreak ? '滞在時間（任意）' : '滞在時間（任意）'}
            htmlFor="spotStayMinutes"
          >
            <div className="flex items-center gap-2">
              <Input
                id="spotStayMinutes"
                type="number"
                min="1"
                max="1440"
                value={formState.stayMinutes}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    stayMinutes: e.target.value,
                  }))
                }
                placeholder="例: 60"
                disabled={isSubmitting}
              />
              <span className="text-sm opacity-60 whitespace-nowrap">分</span>
            </div>
            {plannedDepartureTime && (
              <p className="text-xs opacity-50 mt-1 text-right">
                出発予定:{' '}
                {plannedDepartureTime.toLocaleString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </FormField>
        ) : (
          <FormField
            label={isBreak ? '休憩終了（任意）' : '出発時間（任意）'}
            htmlFor="spotEndAt"
          >
            <DateTimeInput
              id="spotEndAt"
              value={formState.endAt}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, endAt: e.target.value }))
              }
              disabled={isSubmitting}
            />
            {computedStayMinutes !== null && (
              <p className="text-xs opacity-50 mt-1 text-right">
                滞在: {computedStayMinutes}分
              </p>
            )}
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
