'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import type {
  ApiResponseTouringPlanLocation,
  TouringPlanRouteType,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { Select } from '@repo/ui/select'
import { toast } from '@repo/ui/sonner'
import { ModalBase } from '@/components/common/ModalBase'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { buildGoogleMapsTwoPointUrl } from '@/lib/utils/googleMaps'

type LocationType = 'start' | 'destination'

const ROUTE_TYPE_OPTIONS = [
  { value: 'GENERAL', label: '下道' },
  { value: 'HIGHWAY', label: '高速' },
  { value: 'MIXED', label: '混在' },
]

interface PlanLocationEditModalProps {
  bikeId: string
  planId: string
  type: LocationType
  initialLocation: ApiResponseTouringPlanLocation | null
  /** 前の地点（最後の経由地、無ければ出発地）の位置情報。`type === 'destination'`時の経路確認リンクの算出に使う */
  prevLocation?: { lat: number; lng: number } | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * ツーリングプランの出発地・目的地編集モーダル
 *
 * @remarks
 * 地図で緯度経度を選択する。目的地のみ、前の地点からの移動時間・経路種別も設定する
 * （出発予定/到着予定はサーバー側で計算されるため入力項目はない）。
 * 「解除」ボタンで出発地・目的地の設定を解除できる。
 */
export function PlanLocationEditModal({
  bikeId,
  planId,
  type,
  initialLocation,
  prevLocation = null,
  onClose,
  onSuccess,
}: PlanLocationEditModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation?.latitude != null && initialLocation?.longitude != null
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : null
  )
  const [travelMinutesFromPrev, setTravelMinutesFromPrev] = useState(
    initialLocation?.travelMinutesFromPrev != null
      ? String(initialLocation.travelMinutesFromPrev)
      : ''
  )
  const [routeTypeFromPrev, setRouteTypeFromPrev] =
    useState<TouringPlanRouteType>(
      initialLocation?.routeTypeFromPrev ?? 'MIXED'
    )
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

  const routeLink =
    !isStart && prevLocation && location
      ? buildGoogleMapsTwoPointUrl(prevLocation, location, routeTypeFromPrev)
      : null

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
          ? {}
          : {
              travelMinutesFromPrev:
                travelMinutesFromPrev !== ''
                  ? Number(travelMinutesFromPrev)
                  : null,
              routeTypeFromPrev: routeTypeFromPrev,
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

          {!isStart && (
            <>
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
                htmlFor="planLocationTravelMinutesFromPrev"
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="planLocationTravelMinutesFromPrev"
                    type="number"
                    min="0"
                    max="1440"
                    value={travelMinutesFromPrev}
                    onChange={(e) => setTravelMinutesFromPrev(e.target.value)}
                    placeholder="例: 30"
                    disabled={isSaving}
                  />
                  <span className="text-sm opacity-60 whitespace-nowrap">
                    分
                  </span>
                </div>
              </FormField>

              <FormField
                label="経路種別（任意）"
                htmlFor="planLocationRouteTypeFromPrev"
              >
                <Select
                  id="planLocationRouteTypeFromPrev"
                  options={ROUTE_TYPE_OPTIONS}
                  value={routeTypeFromPrev}
                  onChange={(e) =>
                    setRouteTypeFromPrev(e.target.value as TouringPlanRouteType)
                  }
                  disabled={isSaving}
                />
              </FormField>
            </>
          )}

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
