'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import type { ApiResponseTouringPlanSpotDetail } from '@repo/shared-types'
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

interface PlanSpotEditFormProps {
  bikeId: string
  planId: string
  spot: ApiResponseTouringPlanSpotDetail
  onSuccess: () => void
  onDelete?: () => void
}

type PlanSpotFormState = {
  name: string
  memo: string
  plannedArrivalAt: string
  stayMinutes: string
}

/**
 * ツーリングプランの経由地・休憩編集フォーム
 */
export function PlanSpotEditForm({
  bikeId,
  planId,
  spot,
  onSuccess,
  onDelete,
}: PlanSpotEditFormProps) {
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
  const [formState, setFormState] = useState<PlanSpotFormState>({
    name: '',
    memo: '',
    plannedArrivalAt: '',
    stayMinutes: '',
  })

  const isBreak = spot.type === 'BREAK'
  const label = isBreak ? '休憩' : 'スポット'
  const spotsUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots`

  const plannedDepartureTime = (() => {
    if (!formState.plannedArrivalAt || !formState.stayMinutes) return null
    const minutes = parseInt(formState.stayMinutes, 10)
    if (isNaN(minutes) || minutes <= 0) return null
    const date = new Date(formState.plannedArrivalAt)
    date.setMinutes(date.getMinutes() + minutes)
    return date
  })()

  useEffect(() => {
    const initialStayMinutes = (() => {
      if (!spot.plannedArrivalAt || !spot.plannedDepartureAt) return ''
      const diff = Math.round(
        (new Date(spot.plannedDepartureAt).getTime() -
          new Date(spot.plannedArrivalAt).getTime()) /
          60000
      )
      return diff > 0 ? String(diff) : ''
    })()

    setFormState({
      name: spot.name ?? '',
      memo: spot.memo ?? '',
      plannedArrivalAt: spot.plannedArrivalAt
        ? toLocalDateTimeString(spot.plannedArrivalAt)
        : '',
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
        `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots/${spot.touringPlanSpotId}`,
        { latitude: lat, longitude: lng }
      )
      setCurrentLocation({ lat, lng })
      await mutate(spotsUrl)
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
        `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots/${spot.touringPlanSpotId}`
      )
      await mutate(spotsUrl)
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
        `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots/${spot.touringPlanSpotId}`,
        {
          name: formState.name !== '' ? formState.name : null,
          memo: formState.memo !== '' ? formState.memo : null,
          plannedArrivalAt:
            formState.plannedArrivalAt !== ''
              ? new Date(formState.plannedArrivalAt)
              : null,
          plannedDepartureAt: plannedDepartureTime ?? null,
        }
      )

      await mutate(spotsUrl)
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
        <FormField
          label={isBreak ? '場所名' : 'スポット名'}
          htmlFor="planSpotName"
        >
          <Input
            id="planSpotName"
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

        <FormField label="メモ" htmlFor="planSpotMemo">
          <Textarea
            id="planSpotMemo"
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
          label={isBreak ? '休憩開始予定（任意）' : '到着予定（任意）'}
          htmlFor="planSpotPlannedArrivalAt"
        >
          <DateTimeInput
            id="planSpotPlannedArrivalAt"
            value={formState.plannedArrivalAt}
            minuteStep={5}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                plannedArrivalAt: e.target.value,
              }))
            }
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="滞在時間（任意）" htmlFor="planSpotStayMinutes">
          <div className="flex items-center gap-2">
            <Input
              id="planSpotStayMinutes"
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
