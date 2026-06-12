'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import type { ApiResponseTouringPlanLocation } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { FormField } from '@repo/ui/formField'
import { toast } from '@repo/ui/sonner'
import { ModalBase } from '@/components/common/ModalBase'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { toLocalDateTimeString } from '@/lib/utils/dateUtils'

type LocationType = 'start' | 'destination'

interface PlanLocationEditModalProps {
  bikeId: string
  planId: string
  type: LocationType
  initialLocation: ApiResponseTouringPlanLocation | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * ツーリングプランの出発地・目的地編集モーダル
 *
 * @remarks
 * 地図で緯度経度を選択し、出発予定時刻（出発地のみ）/到着予定時刻（目的地のみ）も設定する。
 * 「解除」ボタンで出発地・目的地の設定を解除できる。
 */
export function PlanLocationEditModal({
  bikeId,
  planId,
  type,
  initialLocation,
  onClose,
  onSuccess,
}: PlanLocationEditModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation?.latitude != null && initialLocation?.longitude != null
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : null
  )
  const [plannedTime, setPlannedTime] = useState(() => {
    const value =
      type === 'start'
        ? initialLocation?.plannedDepartureAt
        : initialLocation?.plannedArrivalAt
    return value ? toLocalDateTimeString(value) : ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [error, setError] = useState('')

  const isStart = type === 'start'
  const title = isStart ? '出発地を設定' : '目的地を設定'
  const endpoint = isStart
    ? (`/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/start-location` as const)
    : (`/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/destination-location` as const)
  const spotsUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots`
  const detailUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}`

  const handleLocationSaved = (lat: number, lng: number) => {
    setLocation({ lat, lng })
    setIsLocationModalOpen(false)
  }

  const handleSave = async () => {
    if (!location) {
      setError('位置を設定してください')
      return
    }

    setError('')
    setIsSaving(true)
    try {
      await apiPatch(endpoint, {
        latitude: location.lat,
        longitude: location.lng,
        ...(isStart
          ? {
              plannedDepartureAt:
                plannedTime !== '' ? new Date(plannedTime) : undefined,
            }
          : {
              plannedArrivalAt:
                plannedTime !== '' ? new Date(plannedTime) : undefined,
            }),
      })
      await Promise.all([mutate(detailUrl), mutate(spotsUrl)])
      toast.success(`${isStart ? '出発地' : '目的地'}を更新しました`)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    setError('')
    setIsSaving(true)
    try {
      await apiPatch(endpoint, null)
      await Promise.all([mutate(detailUrl), mutate(spotsUrl)])
      toast.success(`${isStart ? '出発地' : '目的地'}を解除しました`)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : '解除に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <ModalBase title={title} onClose={onClose}>
        <div className="space-y-4">
          <FormField label="位置">
            <div className="flex items-center gap-2">
              <p className="text-xs opacity-60 flex-1">
                {location
                  ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : '未設定'}
              </p>
              <Button
                type="button"
                variant="cloud"
                size="sm"
                onClick={() => setIsLocationModalOpen(true)}
              >
                地図で設定
              </Button>
            </div>
          </FormField>

          <FormField
            label={isStart ? '出発予定時刻（任意）' : '到着予定時刻（任意）'}
            htmlFor="planLocationPlannedTime"
          >
            <DateTimeInput
              id="planLocationPlannedTime"
              value={plannedTime}
              minuteStep={5}
              onChange={(e) => setPlannedTime(e.target.value)}
              disabled={isSaving}
            />
          </FormField>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="button"
            onClick={handleSave}
            fullWidth
            disabled={isSaving}
            loading={isSaving}
          >
            保存する
          </Button>

          {initialLocation && (
            <Button
              type="button"
              variant="danger"
              fullWidth
              disabled={isSaving}
              onClick={handleClear}
            >
              解除する
            </Button>
          )}
        </div>
      </ModalBase>

      {isLocationModalOpen && (
        <LocationPickerModal
          title="位置を設定"
          initialLocation={location}
          isSaving={false}
          onLocationSaved={handleLocationSaved}
          onClose={() => setIsLocationModalOpen(false)}
        />
      )}
    </>
  )
}
