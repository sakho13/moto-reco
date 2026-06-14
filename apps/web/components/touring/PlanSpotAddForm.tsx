'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { Select } from '@repo/ui/select'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { buildGoogleMapsTwoPointUrl } from '@/lib/utils/googleMaps'

type PlanSpotAddFormProps = {
  bikeId: string
  planId: string
  initialType?: 'SPOT' | 'BREAK'
  initialLocation?: { lat: number; lng: number } | null
  /** 前の地点（最後の経由地、無ければ出発地）の位置情報。経路確認リンクの算出に使う */
  prevLocation?: { lat: number; lng: number } | null
  onSuccess: () => void
}

type RouteTypeOption = '' | 'GENERAL' | 'HIGHWAY' | 'MIXED'

type PlanSpotFormState = {
  type: 'SPOT' | 'BREAK'
  name: string
  memo: string
  stayMinutes: string
  travelMinutesFromPrev: string
  routeTypeFromPrev: RouteTypeOption
}

const ROUTE_TYPE_OPTIONS = [
  { value: 'GENERAL', label: '下道' },
  { value: 'HIGHWAY', label: '高速' },
  { value: 'MIXED', label: '混在' },
]

/**
 * ツーリングプランの経由地・休憩追加フォーム
 */
export function PlanSpotAddForm({
  bikeId,
  planId,
  initialType = 'SPOT',
  initialLocation = null,
  prevLocation = null,
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
    stayMinutes: '',
    travelMinutesFromPrev: '',
    routeTypeFromPrev: '',
  })

  const detailUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}`

  const isBreak = formState.type === 'BREAK'

  const routeLink =
    prevLocation && location
      ? buildGoogleMapsTwoPointUrl(prevLocation, location)
      : null

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
          stayMinutes:
            formState.stayMinutes !== ''
              ? Number(formState.stayMinutes)
              : undefined,
          travelMinutesFromPrev:
            formState.travelMinutesFromPrev !== ''
              ? Number(formState.travelMinutesFromPrev)
              : undefined,
          routeTypeFromPrev:
            formState.routeTypeFromPrev !== ''
              ? formState.routeTypeFromPrev
              : undefined,
        }
      )

      await Promise.all([
        mutate(
          `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots`
        ),
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

        {routeLink && (
          <a
            href={routeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline"
          >
            Googleマップで経路を確認
          </a>
        )}

        <FormField
          label="前の地点からの移動時間（任意）"
          htmlFor="planSpotTravelMinutesFromPrev"
        >
          <div className="flex items-center gap-2">
            <Input
              id="planSpotTravelMinutesFromPrev"
              type="number"
              min="0"
              max="1440"
              value={formState.travelMinutesFromPrev}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  travelMinutesFromPrev: e.target.value,
                }))
              }
              placeholder="例: 30"
              disabled={isSubmitting}
            />
            <span className="text-sm opacity-60 whitespace-nowrap">分</span>
          </div>
        </FormField>

        <FormField label="経路種別（任意）" htmlFor="planSpotRouteTypeFromPrev">
          <Select
            id="planSpotRouteTypeFromPrev"
            options={ROUTE_TYPE_OPTIONS}
            placeholder="未選択"
            value={formState.routeTypeFromPrev}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                routeTypeFromPrev: e.target.value as RouteTypeOption,
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
              min="0"
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
