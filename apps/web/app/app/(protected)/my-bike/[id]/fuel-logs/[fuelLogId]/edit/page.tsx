'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseFuelLogList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import {
  FuelLogForm,
  type FuelLogFormData,
} from '@/components/fuel-log/FuelLogForm'
import { apiDelete, authenticatedFetch, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function FuelLogEditPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string
  const fuelLogId = params.fuelLogId as string | undefined

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
            previousMileage: fuelLog.previousMileage.toString(),
            amount: fuelLog.amount.toString(),
            totalPrice: fuelLog.totalPrice.toString(),
            updateTotalMileage: false,
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
      await apiPatch(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        fuelLogId: fuelLogId,
        refueledAt: new Date(formData.refueledAt),
        mileage: Number(formData.mileage),
        previousMileage: Number(formData.previousMileage),
        amount: Number(formData.amount),
        totalPrice: Number(formData.totalPrice),
      })

      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      toast.success('給油履歴を更新しました', {
        description: '給油履歴一覧へ移動します。',
      })
      router.push(`/app/my-bike/${bikeId}/fuel-logs`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!fuelLogId) {
      setError('給油履歴IDが不正です')
      return
    }

    const isConfirmed = window.confirm(
      'この給油履歴を削除しますか？この操作は取り消せません。'
    )
    if (!isConfirmed) {
      return
    }

    setError('')
    setIsDeleting(true)

    try {
      await apiDelete(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        fuelLogId,
      })
      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      toast.success('給油履歴を削除しました', {
        description: '給油履歴一覧へ移動します。',
      })
      router.push(`/app/my-bike/${bikeId}/fuel-logs`)
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

  if (fetchError || !initialData) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/fuel-logs`)}
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
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}/fuel-logs`)}
          >
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
          onClick={() => router.push(`/app/my-bike/${bikeId}/fuel-logs`)}
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
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
            loading={isDeleting}
          >
            削除する
          </Button>
        </div>
      </BaseCard>
    </>
  )
}

export default withAuth(FuelLogEditPage)
