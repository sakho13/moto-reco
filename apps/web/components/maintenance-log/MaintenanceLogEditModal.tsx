'use client'

import { useEffect, useState } from 'react'
import { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseMaintenanceLogDetail,
  MaintenanceType,
} from '@repo/shared-types'
import { toLocalDateTimeString } from '@repo/shared-utils'
import { toast } from '@repo/ui/sonner'
import {
  MaintenanceLogForm,
  type MaintenanceLogFormData,
} from './MaintenanceLogForm'
import { ModalBase } from '@/components/common/ModalBase'
import { trackEvent } from '@/lib/analytics'
import { apiPatch } from '@/lib/api/client'

type MaintenanceLogEditModalProps = {
  bikeId: string
  log: ApiResponseMaintenanceLogDetail
  onClose: () => void
  onSuccess: () => void
}

export function MaintenanceLogEditModal({
  bikeId,
  log,
  onClose,
  onSuccess,
}: MaintenanceLogEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<
    MaintenanceLogFormData | undefined
  >()

  useEffect(() => {
    const dateStr = toLocalDateTimeString(log.performedAt).split('T')[0]
    if (dateStr) {
      setInitialData({
        performedAt: dateStr,
        mileage: log.mileage.toString(),
        memo: log.memo ?? '',
        selectedItems: log.items.map(
          (item) => item.maintenanceType as MaintenanceType
        ),
        updateTotalMileage: false,
      })
    }
  }, [log])

  const handleFormSubmit = async (formData: MaintenanceLogFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const memo = formData.memo.trim()
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}/maintenance-logs`, {
        maintenanceLogId: log.maintenanceLogId,
        performedAt: new Date(formData.performedAt),
        mileage: Number(formData.mileage),
        memo: memo.length > 0 ? memo : null,
        items: formData.selectedItems.map((type) => ({
          maintenanceType: type,
          value: null,
        })),
        updateTotalMileage: formData.updateTotalMileage,
      })
      trackEvent('maintenance_log_update', {
        has_memo: memo.length > 0,
        item_count: formData.selectedItems.length,
        update_total_mileage: formData.updateTotalMileage,
      })

      await mutate(`/api/v1/user-bike/bike/${bikeId}/maintenance-logs`)
      toast.success('メンテナンス履歴を更新しました')
      onSuccess()
    } catch (err) {
      trackEvent('maintenance_log_error', {
        operation: 'update',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalBase title="メンテナンス履歴を編集" onClose={onClose}>
      {initialData && (
        <MaintenanceLogForm
          initialData={initialData}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
          isEdit={true}
        />
      )}
    </ModalBase>
  )
}
