'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseFuelLogList,
  SuccessResponse,
} from '@packages/shared-types'
import { BaseCard } from '@packages/ui/baseCard'
import { Button } from '@packages/ui/button'
import {
  FuelLogForm,
  type FuelLogFormData,
} from '@/components/fuel-log/FuelLogForm'
import { authenticatedFetch, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function FuelLogEditPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string
  const fuelLogId = params.fuelLogId as string | undefined

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [initialData, setInitialData] = useState<FuelLogFormData | undefined>()

  const {
    data,
    error: fetchError,
    isLoading,
  } = useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs` : null,
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
        (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
      return json.data
    }
  )

  useEffect(() => {
    if (data && fuelLogId) {
      const fuelLog = data.find((log) => log.fuelLogId === fuelLogId)
      if (fuelLog) {
        const dateStr = new Date(fuelLog.refueledAt).toISOString().split('T')[0]
        if (dateStr) {
          setInitialData({
            refueledAt: dateStr,
            mileage: fuelLog.mileage.toString(),
            amount: fuelLog.amount.toString(),
            totalPrice: fuelLog.totalPrice.toString(),
          })
        }
      }
    }
  }, [data, fuelLogId])

  const handleFormSubmit = async (formData: FuelLogFormData) => {
    if (!fuelLogId) {
      setError('給油履歴IDが不正です')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        fuelLogId: fuelLogId,
        refueledAt: new Date(formData.refueledAt),
        mileage: Number(formData.mileage),
        amount: Number(formData.amount),
        totalPrice: Number(formData.totalPrice),
      })

      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      router.push(`/my-bike/${bikeId}/fuel-logs`)
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
            onClick={() => router.push(`/my-bike/${bikeId}/fuel-logs`)}
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
              : '給油履歴が見つかりません'}
          </p>
          <Button onClick={() => router.push(`/my-bike/${bikeId}/fuel-logs`)}>
            給油履歴一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-md">
        <Button
          onClick={() => router.push(`/my-bike/${bikeId}/fuel-logs`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard title="給油履歴を編集">
        <FuelLogForm
          initialData={initialData}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
          isEdit={true}
        />
      </BaseCard>
    </>
  )
}

export default withAuth(FuelLogEditPage)
