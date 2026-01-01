'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import {
  MyBikeEditForm,
  type MyBikeEditFormData,
} from '@/components/bike/MyBikeEditForm'
import { authenticatedFetch, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function MyBikeEditPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string

  const [initialData, setInitialData] = useState<MyBikeEditFormData | null>(
    null
  )
  const [isDisplacementEditable, setIsDisplacementEditable] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { data, error: fetchError, isLoading } = useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}` : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'エラーが発生しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseUserBikeDetail>
      return json.data
    }
  )

  useEffect(() => {
    if (!data) {
      return
    }

    setInitialData({
      nickname: data.nickname ?? '',
      totalMileage: data.totalMileage.toString(),
      displacement: data.displacement.toString(),
    })
    setIsDisplacementEditable(data.bikeId === null)
  }, [data])

  const handleFormSubmit = async (formData: MyBikeEditFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}`, {
        nickname: formData.nickname.trim() ? formData.nickname.trim() : null,
        totalMileage: Number(formData.totalMileage),
        ...(isDisplacementEditable
          ? { displacement: Number(formData.displacement) }
          : {}),
      })

      await Promise.all([
        mutate(`/api/v1/user-bike/bike/${bikeId}`),
        mutate('/api/v1/user-bike/bikes'),
      ])
      router.push(`/my-bike/${bikeId}`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
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
            onClick={() => router.push(`/my-bike/${bikeId}`)}
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
              : 'バイク情報の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/my-bike/${bikeId}`)}>
            マイバイクに戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-md">
        <Button onClick={() => router.push(`/my-bike/${bikeId}`)} variant="cloud">
          ← 戻る
        </Button>
      </div>

      <BaseCard title="マイバイク情報を編集">
        <MyBikeEditForm
          initialData={initialData}
          isDisplacementEditable={isDisplacementEditable}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      </BaseCard>
    </>
  )
}

export default withAuth(MyBikeEditPage)
