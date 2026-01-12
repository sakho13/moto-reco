'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseFuelLogList,
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { ToggleSection } from '@repo/ui/toggleSection'
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
  const { data: fuelLogs } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs?per-size=1&sort-order=desc`
      : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || '給油履歴の取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
      return json.data
    }
  )
  const previousFuelLog = fuelLogs?.[0]

  const handleFormSubmit = async (formData: FuelLogFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const memo = formData.memo.trim()
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`, {
        refueledAt: new Date(formData.refueledAt),
        mileage: Number(formData.mileage),
        previousMileage: Number(formData.previousMileage),
        amount: Number(formData.amount),
        totalPrice: Number(formData.totalPrice),
        memo: memo.length > 0 ? memo : null,
        updateTotalMileage: formData.updateTotalMileage,
      })

      await mutate(`/api/v1/user-bike/bike/${bikeId}/fuel-logs`)
      toast.success('給油履歴を登録しました', {
        description: '給油履歴一覧へ移動します。',
      })
      router.push(`/app/my-bike/${bikeId}/fuel-logs`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}/fuel-logs`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard title="給油履歴を登録">
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          {previousFuelLog && (
            <ToggleSection title="前回の給油履歴">
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 'var(--spacing-2)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <dt style={{ color: 'var(--color-ink)', opacity: 0.7 }}>
                  給油日:
                </dt>
                <dd style={{ color: 'var(--color-ink)' }}>
                  {formatDate(previousFuelLog.refueledAt)}
                </dd>
                <dt style={{ color: 'var(--color-ink)', opacity: 0.7 }}>
                  走行距離:
                </dt>
                <dd style={{ color: 'var(--color-ink)' }}>
                  {previousFuelLog.mileage.toLocaleString()} km
                </dd>
                <dt style={{ color: 'var(--color-ink)', opacity: 0.7 }}>
                  給油量:
                </dt>
                <dd style={{ color: 'var(--color-ink)' }}>
                  {previousFuelLog.amount.toFixed(2)} L
                </dd>
                <dt style={{ color: 'var(--color-ink)', opacity: 0.7 }}>
                  給油価格:
                </dt>
                <dd style={{ color: 'var(--color-ink)' }}>
                  ¥{previousFuelLog.totalPrice.toLocaleString()}
                </dd>
                {previousFuelLog.memo && (
                  <>
                    <dt style={{ color: 'var(--color-ink)', opacity: 0.7 }}>
                      メモ:
                    </dt>
                    <dd
                      style={{ color: 'var(--color-ink)', whiteSpace: 'pre-wrap' }}
                    >
                      {previousFuelLog.memo}
                    </dd>
                  </>
                )}
              </dl>
            </ToggleSection>
          )}
        </div>

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
