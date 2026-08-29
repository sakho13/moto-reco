'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { toast } from '@repo/ui/sonner'
import { FuelLogLinkPicker } from './FuelLogLinkPicker'
import { ModalBase } from '@/components/common/ModalBase'
import { authenticatedFetch, apiPatch } from '@/lib/api/client'

/**
 * 給油履歴ピッカーの検索範囲をツーリング期間の前後に広げる幅（時間）
 */
const FUEL_LOG_PICKER_MARGIN_HOURS = 2

interface TouringFuelLogLinkModalProps {
  bikeId: string
  touringId: string
  onClose: () => void
  onSuccess: () => void
}

/**
 * ツーリングと給油履歴の紐づけを管理するモーダル
 *
 * @remarks
 * ツーリング編集モーダルとは独立して開く。給油履歴の選択のみを行い、
 * `PATCH /bike/:myUserBikeId/tourings/:touringId` に `fuelLogIds` のみを送信する
 * （タイトル・日時・走行距離は更新しない）。
 */
export function TouringFuelLogLinkModal({
  bikeId,
  touringId,
  onClose,
  onSuccess,
}: TouringFuelLogLinkModalProps) {
  const [selectedFuelLogIds, setSelectedFuelLogIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const detailUrl = `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`

  const { data, isLoading } = useSWR(detailUrl, async (url) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseTouringDetail>
    return json.data
  })

  useEffect(() => {
    if (data) {
      setSelectedFuelLogIds(data.fuelLogIds)
    }
  }, [data])

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`, {
        fuelLogIds: selectedFuelLogIds,
      })

      await mutate(detailUrl)
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=start-date&sort-order=desc`
      )
      toast.success('給油履歴の紐づけを更新しました')
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalBase title="給油履歴の紐づけ" onClose={onClose}>
      {isLoading || !data ? (
        <p>読み込み中...</p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
          }}
        >
          <FuelLogLinkPicker
            bikeId={bikeId}
            currentTouringId={touringId}
            initialSelectedIds={data.fuelLogIds}
            defaultStartDate={shiftIsoDate(
              data.startDate,
              -FUEL_LOG_PICKER_MARGIN_HOURS
            )}
            defaultEndDate={shiftIsoDate(
              data.endDate,
              FUEL_LOG_PICKER_MARGIN_HOURS
            )}
            onChange={setSelectedFuelLogIds}
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Button
              type="button"
              onClick={onClose}
              variant="cloud"
              disabled={isSubmitting}
              fullWidth
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              fullWidth
            >
              紐づける
            </Button>
          </div>
        </div>
      )}
    </ModalBase>
  )
}

/**
 * ISO日時文字列を指定時間だけシフトする
 */
function shiftIsoDate(isoDate: string, hours: number): string {
  return new Date(
    new Date(isoDate).getTime() + hours * 60 * 60 * 1000
  ).toISOString()
}
