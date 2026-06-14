'use client'

import { useState, useEffect } from 'react'
import { mutate } from 'swr'
import type { ApiResponseTouringPlanSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { Select } from '@repo/ui/select'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { SpotDeleteConfirmModal } from '@/components/spot/SpotDeleteConfirmModal'
import { apiDelete, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { buildGoogleMapsTwoPointUrl } from '@/lib/utils/googleMaps'

interface PlanSpotEditFormProps {
  bikeId: string
  planId: string
  spot: ApiResponseTouringPlanSpotDetail
  /** 前の地点（編集対象スポットの直前のスポット、無ければ出発地）の位置情報。経路確認リンクの算出に使う */
  prevLocation?: { lat: number; lng: number } | null
  onSuccess: () => void
  onDelete?: () => void
}

type RouteTypeOption = '' | 'GENERAL' | 'HIGHWAY' | 'MIXED'

type PlanSpotFormState = {
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
 * 計算済みの予定時刻を `"YYYY/M/D HH:mm"` 形式に整形する。
 *
 * @remarks
 * `value` が `null` の場合は「未設定」を返す。
 */
const formatPlannedTime = (value: string | null): string => {
  if (value === null) return '未設定'
  try {
    return new Date(value).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

/**
 * ツーリングプランの経由地・休憩編集フォーム
 */
export function PlanSpotEditForm({
  bikeId,
  planId,
  spot,
  prevLocation = null,
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
    stayMinutes: '',
    travelMinutesFromPrev: '',
    routeTypeFromPrev: '',
  })

  const isBreak = spot.type === 'BREAK'
  const label = isBreak ? '休憩' : 'スポット'
  const spotsUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}/spots`
  const detailUrl = `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}`

  const routeLink =
    prevLocation && currentLocation
      ? buildGoogleMapsTwoPointUrl(prevLocation, currentLocation)
      : null

  useEffect(() => {
    setFormState({
      name: spot.name ?? '',
      memo: spot.memo ?? '',
      stayMinutes: spot.stayMinutes != null ? String(spot.stayMinutes) : '',
      travelMinutesFromPrev:
        spot.travelMinutesFromPrev != null
          ? String(spot.travelMinutesFromPrev)
          : '',
      routeTypeFromPrev: spot.routeTypeFromPrev ?? '',
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
      await Promise.all([mutate(spotsUrl), mutate(detailUrl)])
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
          stayMinutes:
            formState.stayMinutes !== '' ? Number(formState.stayMinutes) : null,
          travelMinutesFromPrev:
            formState.travelMinutesFromPrev !== ''
              ? Number(formState.travelMinutesFromPrev)
              : null,
          routeTypeFromPrev:
            formState.routeTypeFromPrev !== ''
              ? formState.routeTypeFromPrev
              : null,
        }
      )

      await Promise.all([mutate(spotsUrl), mutate(detailUrl)])
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

        <FormField label={isBreak ? '休憩開始予定' : '到着予定'}>
          <p className="text-sm">{formatPlannedTime(spot.plannedArrivalAt)}</p>
        </FormField>

        <FormField label={isBreak ? '休憩終了予定' : '出発予定'}>
          <p className="text-sm">
            {formatPlannedTime(spot.plannedDepartureAt)}
          </p>
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
