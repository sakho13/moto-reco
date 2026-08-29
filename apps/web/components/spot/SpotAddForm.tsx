'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import {
  getNowLocalDateTimeString,
  toLocalDateTimeString,
} from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPost } from '@/lib/api/client'

type SpotAddFormProps = {
  bikeId: string
  touringId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  /** 直前のスポットの出発（または到着）日時。新規スポットの到着日時の初期値に使用する */
  prevSpotDepartedAt?: string
  onSuccess: () => void
}

type SpotFormState = {
  type: 'SPOT' | 'BREAK'
  name: string
  memo: string
  arrivedAt: string
  departedAt: string
}

/**
 * スポット・休憩追加フォーム
 *
 * @remarks
 * 実績記録専用フォーム。到着日時(`arrivedAt`)・出発日時(`departedAt`)を記録する。
 */
export function SpotAddForm({
  bikeId,
  touringId,
  initialType = 'SPOT',
  initialLocation = null,
  prevSpotDepartedAt,
  onSuccess,
}: SpotAddFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation
  )
  const [formState, setFormState] = useState<SpotFormState>({
    type: initialType,
    name: '',
    memo: '',
    arrivedAt: prevSpotDepartedAt
      ? toLocalDateTimeString(new Date(prevSpotDepartedAt))
      : getNowLocalDateTimeString(),
    departedAt: '',
  })

  const isBreak = formState.type === 'BREAK'

  const computedStayMinutes = (() => {
    if (!formState.arrivedAt || !formState.departedAt) return null
    const diff = Math.round(
      (new Date(formState.departedAt).getTime() -
        new Date(formState.arrivedAt).getTime()) /
        60000
    )
    return diff > 0 ? diff : null
  })()

  const handleLocationSaved = (lat: number, lng: number) => {
    setLocation({ lat, lng })
    setIsLocationModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formState.arrivedAt) {
      setError('訪問日時を入力してください')
      return
    }

    setIsSubmitting(true)

    try {
      await apiPost(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`,
        {
          type: formState.type,
          name: formState.name !== '' ? formState.name : undefined,
          memo: formState.memo !== '' ? formState.memo : undefined,
          arrivedAt: new Date(formState.arrivedAt),
          departedAt:
            formState.departedAt !== ''
              ? new Date(formState.departedAt)
              : undefined,
          latitude: location?.lat,
          longitude: location?.lng,
        }
      )

      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
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
        <FormField label="種別" htmlFor="spotType">
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="spotType"
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
                name="spotType"
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
