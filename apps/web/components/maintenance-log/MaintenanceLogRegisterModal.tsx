'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { toast } from '@repo/ui/sonner'
import {
  MaintenanceLogForm,
  type MaintenanceLogFormData,
} from './MaintenanceLogForm'
import { ModalBase } from '@/components/common/ModalBase'
import { apiPost, authenticatedFetch } from '@/lib/api/client'

type MaintenanceLogRegisterModalProps = {
  bikeId: string
  onClose: () => void
  onSuccess: () => void
}

export function MaintenanceLogRegisterModal({
  bikeId,
  onClose,
  onSuccess,
}: MaintenanceLogRegisterModalProps) {
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

  const handleFormSubmit = async (formData: MaintenanceLogFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const memo = formData.memo.trim()
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/maintenance-logs`, {
        performedAt: new Date(formData.performedAt),
        mileage: Number(formData.mileage),
        memo: memo.length > 0 ? memo : null,
        items: formData.selectedItems.map((type) => ({
          maintenanceType: type,
          value: null,
        })),
        updateTotalMileage: formData.updateTotalMileage,
      })

      await mutate(`/api/v1/user-bike/bike/${bikeId}/maintenance-logs`)
      toast.success('メンテナンス履歴を登録しました')
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalBase title="メンテナンス履歴を登録" onClose={onClose}>
      <MaintenanceLogForm
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={error}
        totalMileage={bike?.totalMileage}
      />
    </ModalBase>
  )
}
