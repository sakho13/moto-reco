'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import {
  TouringForm,
  type TouringFormData,
} from '@/components/touring/TouringForm'
import { authenticatedFetch, apiPatch, apiDelete } from '@/lib/api/client'
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
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
      const pad = (n: number) => String(n).padStart(2, '0')
      const toLocalDate = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      const toLocalTime = (d: Date) =>
        `${pad(d.getHours())}:${pad(d.getMinutes())}`

      const start = new Date(data.startDate)
      const end = new Date(data.endDate)

      setInitialData({
        title: data.title,
        startDate: toLocalDate(start),
        startTime: toLocalTime(start),
        endDate: toLocalDate(end),
        endTime: toLocalTime(end),
        startMileage: data.startMileage?.toString() ?? '',
        endMileage: data.endMileage?.toString() ?? '',
        mode: data.status === 'PLANNED' ? 'plan' : 'history',
      })
    }
  }, [data])

  const handleFormSubmit = async (formData: TouringFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`, {
        title: formData.title,
        startDate: new Date(
          `${formData.startDate}T${formData.startTime || '00:00'}`
        ),
        endDate: new Date(`${formData.endDate}T${formData.endTime || '00:00'}`),
        startMileage: formData.startMileage
          ? Number(formData.startMileage)
          : null,
        endMileage: formData.endMileage ? Number(formData.endMileage) : null,
        status: formData.mode === 'plan' ? 'PLANNED' : 'COMPLETED',
      })

      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=start-date&sort-order=desc`
      )
      await mutate(detailUrl)
      toast.success('更新しました')
      onSuccess('update')
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiDelete(`/api/v1/user-bike/bike/${bikeId}/tourings`, {
        touringId,
      })
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=start-date&sort-order=desc`
      )
      onSuccess('delete')
    } catch (err) {
      toast.error(
        err instanceof ApiV1Error ? err.message : '削除に失敗しました'
      )
      setConfirmingDelete(false)
    } finally {
      setIsDeleting(false)
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
      }}
    >
      <TouringForm
        initialData={initialData}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={error}
        isEdit
      />

      <hr style={{ borderColor: 'var(--color-cloud)', margin: '0' }} />

      {confirmingDelete ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-ink)',
            }}
          >
            このツーリングを削除しますか？この操作は取り消せません。
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Button
              onClick={() => setConfirmingDelete(false)}
              variant="cloud"
              size="sm"
              disabled={isDeleting}
              fullWidth
            >
              キャンセル
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              size="sm"
              disabled={isDeleting}
              loading={isDeleting}
              fullWidth
            >
              {isDeleting ? '削除中...' : '削除する'}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setConfirmingDelete(true)}
          variant="danger"
          size="sm"
          disabled={isSubmitting}
        >
          削除
        </Button>
      )}
    </div>
  )
}
