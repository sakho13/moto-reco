'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

type PlanSpotAddFormProps = {
  bikeId: string
  planId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  onSuccess: () => void
}

type PlanSpotFormState = {
  type: 'SPOT' | 'BREAK'
  name: string
  memo: string
  plannedArrivalAt: string
  stayMinutes: string
}

/**
 * ツーリングプランの経由地・休憩追加フォーム
 */
export function PlanSpotAddForm({
  bikeId,
  planId,
  initialType = 'SPOT',
  initialLocation = null,
  onSuccess,
}: PlanSpotAddFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation
  )
  const [formState, setFormState] = useState<PlanSpotFormState>({
    type: initialType,
    name: '',
    memo: '',
    plannedArrivalAt: '',
    stayMinutes: '',
  })

  const detailUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}`

  const isBreak = formState.type === 'BREAK'

  const plannedDepartureTime = (() => {
    if (!formState.plannedArrivalAt || !formState.stayMinutes) return null
    const minutes = parseInt(formState.stayMinutes, 10)
    if (isNaN(minutes) || minutes <= 0) return null
    const date = new Date(formState.plannedArrivalAt)
    date.setMinutes(date.getMinutes() + minutes)
    return date
  })()

  const handleLocationSaved = (lat: number, lng: number) => {
    setLocation({ lat, lng })
    setIsLocationModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await apiPost(
        `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots`,
        {
          type: formState.type,
          name: formState.name !== '' ? formState.name : undefined,
          memo: formState.memo !== '' ? formState.memo : undefined,
          latitude: location?.lat,
          longitude: location?.lng,
          plannedArrivalAt:
            formState.plannedArrivalAt !== ''
              ? new Date(formState.plannedArrivalAt)
              : undefined,
          plannedDepartureAt: plannedDepartureTime ?? undefined,
        }
      )

      await Promise.all([
        mutate(`/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots`),
        mutate(detailUrl),
      ])
      toast.success(isBreak ? '休憩を追加しました' : 'スポットを追加しました')
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
        <FormField label="種別" htmlFor="planSpotType">
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="planSpotType"
                value="SPOT"
                checked={formState.type === 'SPOT'}
                onChange={() =>
                  setFormState((prev) => ({ ...prev, type: 'SPOT' }))
                }
                disabled={isSubmitting}
              />
              <span className="text-sm">立ち寄り</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="planSpotType"
                value="BREAK"
                checked={formState.type === 'BREAK'}
                onChange={() =>
                  setFormState((prev) => ({ ...prev, type: 'BREAK' }))
                }
                disabled={isSubmitting}
              />
              <span className="text-sm">休憩</span>
            </label>
          </div>
        </FormField>

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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          fullWidth
          loading={isSubmitting}
        >
          登録する
        </Button>
      </form>

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
