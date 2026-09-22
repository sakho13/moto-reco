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
import { fetchPreviousFuelLog } from '@/lib/api/fuelLogs'
import {
  mutateActiveBikeList,
  mutateFuelLogLists,
  mutateHistoryLists,
} from '@/lib/api/mutateHistory'
import { getBikeDisplayName } from '@/lib/bike'
import {
  calculateAverageFuelEfficiency,
  resolveSubmitPreviousMileage,
  shouldUpdateTotalMileage,
  type PreviousFuelLogDetail,
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

  // 直近N件を取得する。fuelLogs[0] が前回給油（前回値の初期値・PC版控え欄に使用）、
  // 残りはPC版控え欄の「平均より」比較用（燃費を算出できなかったログは平均の対象外）。
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
  const previousFuelLogEntry = fuelLogs?.[0] ?? null
  const previousFuelLog: PreviousFuelLogDetail | null = previousFuelLogEntry
    ? {
        mileage: previousFuelLogEntry.mileage,
        isFullTank: previousFuelLogEntry.isFullTank,
        refueledAt: previousFuelLogEntry.refueledAt,
        amount: previousFuelLogEntry.amount,
        totalPrice: previousFuelLogEntry.totalPrice,
        fuelEfficiency: previousFuelLogEntry.fuelEfficiency,
        pricePerLiter: previousFuelLogEntry.pricePerLiter,
      }
    : null
  const averageFuelEfficiency = calculateAverageFuelEfficiency(fuelLogs ?? [])

  const handleFormSubmit = async (values: FuelLogRegisterSheetSubmitValues) => {
    setError('')
    setIsSubmitting(true)

    try {
      const memo = values.memo.trim()
      // previousMileage は選択した給油日時（過去に遡って記録するバックデート
      // 入力を含む）を条件にサーバーへ直接問い合わせて解決する。直近数件の
      // ウィンドウ（fuelLogs）内を検索すると、ウィンドウの外まで遡った場合に
      // 該当ログを見つけられず区間距離が無言で0kmになる不具合があったため、
      // ここでは解決結果に依存せずウィンドウを使わない（Issue #575 レビュー指摘）。
      // 問い合わせ自体が失敗した場合は catch 節でエラー表示のみ行い、
      // 無言のフォールバックはせず保存を中止する。
      const resolvedPreviousLog = await fetchPreviousFuelLog(
        bikeId,
        values.refueledAt
      )
      const previousMileage = resolveSubmitPreviousMileage({
        mileage: values.mileage,
        resolvedPreviousLog,
        totalMileage: bike?.totalMileage,
      })
      const updateTotalMileage = shouldUpdateTotalMileage(
        values.mileage,
        bike?.totalMileage
      )

      await apiPost(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        refueledAt: new Date(values.refueledAt),
        mileage: values.mileage,
        previousMileage,
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
        vehicleName={bike ? getBikeDisplayName(bike) : null}
        previousFuelLog={previousFuelLog}
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
