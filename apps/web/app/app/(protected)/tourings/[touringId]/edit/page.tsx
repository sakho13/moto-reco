'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import {
  TouringForm,
  type TouringFormData,
} from '@/components/touring/TouringForm'
import { apiPatch, authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringEditPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const touringId = params.touringId as string
  const bikeId = searchParams.get('bikeId') ?? ''

  const [isSubmitting, setIsSubmitting] = useState(false)
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
    if (!data) {
      return
    }
    const startDate = new Date(data.startDate).toISOString().split('T')[0]
    const endDate = new Date(data.endDate).toISOString().split('T')[0]
    setInitialData({
      title: data.title,
      startDate,
      endDate,
      startMileage: data.startMileage?.toString() ?? '',
      endMileage: data.endMileage?.toString() ?? '',
    })
  }, [data])

  const handleFormSubmit = async (formData: TouringFormData) => {
    if (!bikeId) {
      setError('バイクIDが不正です')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}/tourings/${touringId}`, {
        title: formData.title.trim(),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        ...(formData.startMileage !== ''
          ? { startMileage: Number(formData.startMileage) }
          : {}),
        ...(formData.endMileage !== ''
          ? { endMileage: Number(formData.endMileage) }
          : {}),
      })

      toast.success('ツーリング記録を更新しました', {
        description: 'ツーリング記録詳細へ移動します。',
      })
      router.push(`/app/tourings/${touringId}?bikeId=${bikeId}`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
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

  if (fetchError || !initialData) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button
            onClick={() =>
              router.push(`/app/tourings/${touringId}?bikeId=${bikeId}`)
            }
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
              : 'ツーリング記録が見つかりません'}
          </p>
          <Button
            onClick={() =>
              router.push(`/app/tourings/${touringId}?bikeId=${bikeId}`)
            }
          >
            ツーリング記録詳細に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <div className="w-full">
        <Button
          onClick={() =>
            router.push(`/app/tourings/${touringId}?bikeId=${bikeId}`)
          }
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard title="ツーリング記録を編集">
        <TouringForm
          initialData={initialData}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
          isEdit={true}
        />
      </BaseCard>
    </div>
  )
}

export default withAuth(TouringEditPage)
