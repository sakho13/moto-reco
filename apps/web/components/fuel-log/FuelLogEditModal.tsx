'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseFuelLogDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { toLocalDateTimeString } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { FuelLogForm, type FuelLogFormData } from './FuelLogForm'
import { ModalBase } from '@/components/common/ModalBase'
import { trackEvent } from '@/lib/analytics'
import { apiDelete, apiPatch, authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

interface FuelLogEditModalProps {
  bikeId: string
  fuelLogId: string
  onClose: () => void
  onSuccess: (action: 'update' | 'delete') => void
}

export function FuelLogEditModal({
  bikeId,
  fuelLogId,
  onClose,
  onSuccess,
}: FuelLogEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<FuelLogFormData | undefined>()

  const detailUrl = `/api/v1/user-bike/bike/${bikeId}/fuel-logs/${fuelLogId}`

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
      (await response.json()) as SuccessResponse<ApiResponseFuelLogDetail>
    return json.data
  })

  useEffect(() => {
    if (data) {
      setInitialData({
        refueledAt: toLocalDateTimeString(data.refueledAt),
        mileage: data.mileage.toString(),
        previousMileage: data.previousMileage.toString(),
        amount: data.amount.toString(),
        totalPrice: data.totalPrice.toString(),
        memo: data.memo ?? '',
        updateTotalMileage: false,
      })
    }
  }, [data])

  const handleFormSubmit = async (formData: FuelLogFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const memo = formData.memo.trim()
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        fuelLogId,
        refueledAt: new Date(formData.refueledAt),
        mileage: Number(formData.mileage),
        previousMileage: Number(formData.previousMileage),
        amount: Number(formData.amount),
        totalPrice: Number(formData.totalPrice),
        memo: memo.length > 0 ? memo : null,
      })
      trackEvent('fuel_log_update')

      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      await mutate(detailUrl)
      toast.success('給油履歴を更新しました')
      onSuccess('update')
    } catch (err) {
      trackEvent('fuel_log_error', {
        operation: 'update',
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

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      'この給油履歴を削除しますか？この操作は取り消せません。'
    )
    if (!isConfirmed) return

    setError('')
    setIsDeleting(true)

    try {
      await apiDelete(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        fuelLogId,
      })
      trackEvent('fuel_log_delete')
      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      await mutate(detailUrl)
      toast.success('給油履歴を削除しました')
      onSuccess('delete')
    } catch (err) {
      trackEvent('fuel_log_error', {
        operation: 'delete',
        ...(err instanceof ApiV1Error
          ? {
              error_code: err.errorCode,
              error_message: err.message,
            }
          : {}),
      })
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ModalBase title="給油履歴を編集" onClose={onClose}>
      {isLoading && <p>読み込み中...</p>}

      {!isLoading && initialData && (
        <>
          <FuelLogForm
            initialData={initialData}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            error={error}
            isEdit={true}
          />
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
            variant="danger"
            fullWidth
            loading={isDeleting}
            style={{ marginTop: 'var(--spacing-2)' }}
          >
            削除する
          </Button>
        </>
      )}
    </ModalBase>
  )
}
