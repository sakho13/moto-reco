'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { toast } from '@repo/ui/sonner'
import {
  TouringForm,
  type TouringFormData,
} from '@/components/touring/TouringForm'
import { authenticatedFetch, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

interface TouringEditFormProps {
  bikeId: string
  touringId: string
  onSuccess: (action: 'update' | 'delete') => void
}

export function TouringEditForm({
  bikeId,
  touringId,
  onSuccess,
}: TouringEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<TouringFormData | undefined>()

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
      const startDateStr = new Date(data.startDate).toISOString().split('T')[0]
      const endDateStr = new Date(data.endDate).toISOString().split('T')[0]

      if (startDateStr && endDateStr) {
        setInitialData({
          title: data.title,
          startDate: startDateStr,
          endDate: endDateStr,
          startMileage: data.startMileage?.toString() ?? '',
          endMileage: data.endMileage?.toString() ?? '',
        })
      }
    }
  }, [data])

  const handleFormSubmit = async (formData: TouringFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`, {
        title: formData.title,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        startMileage: formData.startMileage
          ? Number(formData.startMileage)
          : null,
        endMileage: formData.endMileage ? Number(formData.endMileage) : null,
        status: 'COMPLETED',
      })

      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=end-date&sort-order=desc`
      )
      await mutate(detailUrl)
      toast.success('ツーリング履歴を更新しました')
      onSuccess('update')
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm" style={{ opacity: 0.5 }}>
        読み込み中...
      </p>
    )
  }

  if (!initialData) return null

  return (
    <TouringForm
      initialData={initialData}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      error={error}
      isEdit
    />
  )
}

