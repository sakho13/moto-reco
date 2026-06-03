'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

type SpotAddFormProps = {
  bikeId: string
  touringId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  touringStatus?: 'PLANNED' | 'STARTED' | 'COMPLETED'
  onSuccess: () => void
}

type SpotFormState = {
  type: 'SPOT' | 'BREAK'
  name: string
  memo: string
  visitedAt: string
  endAt: string
}

const getNowLocalString = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/**
 * スポット・休憩追加フォーム
 */
export function SpotAddForm({
  bikeId,
  touringId,
  initialType = 'SPOT',
  initialLocation = null,
  touringStatus,
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
    visitedAt: touringStatus === 'PLANNED' ? '' : getNowLocalString(),
    endAt: '',
  })

  const isBreak = formState.type === 'BREAK'
  const isPlanned = touringStatus === 'PLANNED'

  const stayMinutes = (() => {
    if (!formState.visitedAt || !formState.endAt) return null
    const diff = Math.round(
      (new Date(formState.endAt).getTime() -
        new Date(formState.visitedAt).getTime()) /
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

    if (!formState.visitedAt) {
      setError(
        isPlanned
          ? '到着予定時間を入力してください'
          : '訪問日時を入力してください'
      )
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
          visitedAt: new Date(formState.visitedAt),
          endAt: formState.endAt !== '' ? new Date(formState.endAt) : undefined,
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

        <FormField
          label={
            isBreak
              ? isPlanned
                ? '休憩終了予定（任意）'
                : '休憩終了（任意）'
              : isPlanned
                ? '出発予定（任意）'
                : '出発時間（任意）'
          }
          htmlFor="spotEndAt"
        >
          <Input
            id="spotEndAt"
            type="datetime-local"
            value={formState.endAt}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, endAt: e.target.value }))
            }
            disabled={isSubmitting}
          />
          {stayMinutes !== null && (
            <p className="text-xs opacity-50 mt-1 text-right">
              滞在: {stayMinutes}分
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
