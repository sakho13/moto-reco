'use client'

import { useEffect, useState } from 'react'
import { mutate } from 'swr'
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
import { apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

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

      await mutate(`/api/v1/user-bike/bike/${bikeId}/maintenance-logs`)
      toast.success('メンテナンス履歴を更新しました')
      onSuccess()
    } catch (err) {
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
