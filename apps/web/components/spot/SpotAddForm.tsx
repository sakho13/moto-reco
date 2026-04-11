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
  onSuccess: () => void
}

type SpotFormState = {
  name: string
  memo: string
  visitedAt: string
}

const getNowLocalString = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/**
 * スポット追加フォーム
 */
export function SpotAddForm({
  bikeId,
  touringId,
  onSuccess,
}: SpotAddFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [formState, setFormState] = useState<SpotFormState>({
    name: '',
    memo: '',
    visitedAt: getNowLocalString(),
  })

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
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`,
        {
          name: formState.name !== '' ? formState.name : undefined,
          memo: formState.memo !== '' ? formState.memo : undefined,
          visitedAt: new Date(formState.visitedAt),
          latitude: location?.lat,
          longitude: location?.lng,
        }
      )

      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}/spots`
      )
      toast.success('スポットを追加しました')
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
        <FormField label="スポット名" htmlFor="spotName">
          <Input
            id="spotName"
            type="text"
            value={formState.name}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, name: e.target.value }))
            }
            maxLength={100}
            placeholder="スポット名（任意）"
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

        <FormField label="訪問日時" htmlFor="spotVisitedAt">
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
