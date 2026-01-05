'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/useToast'
import {
  FuelLogForm,
  type FuelLogFormData,
} from '@/components/fuel-log/FuelLogForm'
import { apiPost, authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function FuelLogRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string

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

  const handleFormSubmit = async (formData: FuelLogFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        refueledAt: new Date(formData.refueledAt),
        mileage: Number(formData.mileage),
        previousMileage: Number(formData.previousMileage),
        amount: Number(formData.amount),
        totalPrice: Number(formData.totalPrice),
        updateTotalMileage: formData.updateTotalMileage,
      })

      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      toast({
        title: '給油履歴を登録しました',
        description: '給油履歴一覧へ移動します。',
        variant: 'success',
      })
      router.push(`/my-bike/${bikeId}/fuel-logs`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => router.push(`/my-bike/${bikeId}/fuel-logs`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard title="給油履歴を登録">
        <FuelLogForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
          totalMileage={bike?.totalMileage}
        />
      </BaseCard>
    </>
  )
}

export default withAuth(FuelLogRegisterPage)
