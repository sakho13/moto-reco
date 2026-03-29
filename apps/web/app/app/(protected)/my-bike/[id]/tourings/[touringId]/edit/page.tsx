'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { TrashIcon } from '@/components/icons/TrashIcon'
import {
  TouringForm,
  type TouringFormData,
} from '@/components/touring/TouringForm'
import { apiDelete, authenticatedFetch, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringEditPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string
  const touringId = params.touringId as string | undefined

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<TouringFormData | undefined>()

  const detailUrl =
    bikeId && touringId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`
      : null

  const {
    data,
    error: fetchError,
    isLoading,
  } = useSWR(detailUrl, async (url) => {
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
    if (!touringId) {
      setError('ツーリングIDが不正です')
      return
    }

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
      if (detailUrl) {
        await mutate(detailUrl)
      }
      toast.success('ツーリング履歴を更新しました', {
        description: 'ツーリング履歴一覧へ移動します。',
      })
      router.push(`/app/my-bike/${bikeId}/tourings`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!touringId) {
      setError('ツーリングIDが不正です')
      return
    }

    const isConfirmed = window.confirm(
      'このツーリング履歴を削除しますか？この操作は取り消せません。'
    )
    if (!isConfirmed) {
      return
    }

    setError('')
    setIsDeleting(true)

    try {
      await apiDelete(`/api/v1/user-bike/bike/${bikeId}/tourings`, {
        touringId,
      })
      await mutate(
        `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=end-date&sort-order=desc`
      )
      if (detailUrl) {
        await mutate(detailUrl)
      }
      toast.success('ツーリング履歴を削除しました', {
        description: 'ツーリング履歴一覧へ移動します。',
      })
      router.push(`/app/my-bike/${bikeId}/tourings`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <>
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700 mb-4">
            {fetchError instanceof ApiV1Error
              ? fetchError.message
              : 'ツーリング履歴の取得に失敗しました'}
          </p>
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
          >
            ツーリング履歴一覧に戻る
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <BaseCard
          title="ツーリング履歴を編集"
          headerAction={
            <Button
              onClick={handleDelete}
              variant="danger"
              disabled={isDeleting}
              loading={isDeleting}
            >
              <TrashIcon />
            </Button>
          }
        >
          {initialData && (
            <TouringForm
              initialData={initialData}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              error={error}
              isEdit
            />
          )}
        </BaseCard>
      </div>
    </>
  )
}

export default withAuth(TouringEditPage)
