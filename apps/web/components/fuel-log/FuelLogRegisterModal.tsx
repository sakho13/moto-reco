'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
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
import { mutateHistoryLists } from '@/lib/api/mutateHistory'
import {
  resolveSubmitPreviousMileage,
  shouldUpdateTotalMileage,
} from '@/lib/fuelLogSheet'

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

  const { data: fuelLogs } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs?per-size=1&sort-order=desc`
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
  const previousFuelLog = fuelLogs?.[0] ?? null

  const handleFormSubmit = async (values: FuelLogRegisterSheetSubmitValues) => {
    setError('')
    setIsSubmitting(true)

    try {
      const memo = values.memo.trim()
      const previousMileage = resolveSubmitPreviousMileage({
        previousLog: previousFuelLog,
        totalMileage: bike?.totalMileage,
        mileage: values.mileage,
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

      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      await mutateHistoryLists()
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
    <ModalBase title="給油を記録" onClose={onClose}>
      <FuelLogRegisterSheet
        previousFuelLog={
          previousFuelLog
            ? {
                mileage: previousFuelLog.mileage,
                isFullTank: previousFuelLog.isFullTank,
              }
            : null
        }
        hasTouring={Boolean(touringId)}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleFormSubmit}
      />
    </ModalBase>
  )
}
