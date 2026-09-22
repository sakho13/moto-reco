'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelLogList,
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { toast } from '@repo/ui/sonner'
import {
  FuelLogRegisterSheet,
  type FuelLogRegisterSheetSubmitValues,
} from './FuelLogRegisterSheet'
import { ModalBase } from '@/components/common/ModalBase'
import { trackEvent } from '@/lib/analytics'
import { apiPost, authenticatedFetch } from '@/lib/api/client'
import {
  mutateActiveBikeList,
  mutateFuelLogLists,
  mutateHistoryLists,
} from '@/lib/api/mutateHistory'
import { getBikeDisplayName } from '@/lib/bike'
import {
  calculateAverageFuelEfficiency,
  shouldUpdateTotalMileage,
} from '@/lib/fuelLogSheet'

/** PC版「控え」の平均燃費に使う直近件数（「直近6回」という文言と対応させる） */
const RECENT_FUEL_LOG_COUNT = 6

interface FuelLogRegisterModalProps {
  bikeId: string
  touringId?: string
  onClose: () => void
  onSuccess: () => void
}

export function FuelLogRegisterModal({
  bikeId,
  touringId,
  onClose,
  onSuccess,
}: FuelLogRegisterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { data: bike } = useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}` : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'バイク情報の取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseUserBikeDetail>
      return json.data
    }
  )

  // 直近N件を取得する（PC版控え欄の「平均より」比較用。燃費を算出できなかった
  // ログは平均の対象外）。「前回給油」自体は `FuelLogRegisterSheet` が選択中の
  // 給油日時に応じてサーバーへ直接問い合わせて解決するため、ここでは使わない
  // （Issue #575 レビュー指摘: ライブ計器の表示と保存値の食い違い対策）。
  const { data: fuelLogs } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs?per-size=${RECENT_FUEL_LOG_COUNT}&sort-order=desc`
      : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || '給油履歴の取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
      return json.data
    }
  )
  const averageFuelEfficiency = calculateAverageFuelEfficiency(fuelLogs ?? [])

  const handleFormSubmit = async (values: FuelLogRegisterSheetSubmitValues) => {
    setError('')
    setIsSubmitting(true)

    try {
      const memo = values.memo.trim()
      // previousMileage は `FuelLogRegisterSheet` が選択中の給油日時（過去に
      // 遡って記録するバックデート入力を含む）を基準にサーバーへ直接問い合わせて
      // 解決済みの値をそのまま使う。ライブ計器・「前回の控え」パネルの表示に
      // 使ったのと同じ解決結果のため、画面表示と保存値が食い違わない
      // （Issue #575 レビュー指摘）。
      const updateTotalMileage = shouldUpdateTotalMileage(
        values.mileage,
        bike?.totalMileage
      )

      await apiPost(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        refueledAt: new Date(values.refueledAt),
        mileage: values.mileage,
        previousMileage: values.previousMileage,
        amount: values.amount,
        totalPrice: values.totalPrice,
        isFullTank: values.isFullTank,
        memo: memo.length > 0 ? memo : null,
        updateTotalMileage,
        touringId: touringId ?? null,
      })
      trackEvent('fuel_log_create', {
        has_memo: memo.length > 0,
        update_total_mileage: updateTotalMileage,
        is_full_tank: values.isFullTank,
      })

      await mutateFuelLogLists(bikeId)
      await mutateHistoryLists()
      if (updateTotalMileage) {
        // 総走行距離が更新された場合、ActiveBikeContext（ホームのODO計器等）が
        // 参照するアクティブ車両一覧も再検証しないと古いODOが残ってしまう
        await mutateActiveBikeList()
      }
      toast.success('給油を記録しました')
      onSuccess()
    } catch (err) {
      trackEvent('fuel_log_error', {
        operation: 'create',
        ...(err instanceof ApiV1Error
          ? {
              error_code: err.errorCode,
              error_message: err.message,
            }
          : {}),
      })
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalBase title="給油" onClose={onClose} size="lg" hideTitleOnDesktop>
      <FuelLogRegisterSheet
        bikeId={bikeId}
        vehicleName={bike ? getBikeDisplayName(bike) : null}
        averageFuelEfficiency={averageFuelEfficiency}
        recentAverageCount={RECENT_FUEL_LOG_COUNT}
        currentTotalMileage={bike?.totalMileage}
        hasTouring={Boolean(touringId)}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleFormSubmit}
        onClose={onClose}
      />
    </ModalBase>
  )
}
