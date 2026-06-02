'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { mutate } from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import {
  TouringForm,
  type TouringFormData,
} from '@/components/touring/TouringForm'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFormSubmit = async (formData: TouringFormData) => {
    setError('')
    setIsSubmitting(true)

    const isPlan = formData.mode === 'plan'

    try {
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/tourings`, {
        title: formData.title,
        startDate: new Date(
          `${formData.startDate}T${formData.startTime || '00:00'}`
        ),
        endDate: new Date(`${formData.endDate}T${formData.endTime || '00:00'}`),
        ...(formData.startMileage
          ? { startMileage: Number(formData.startMileage) }
          : {}),
        ...(!isPlan && formData.endMileage
          ? { endMileage: Number(formData.endMileage) }
          : {}),
        status: isPlan ? 'PLANNED' : 'COMPLETED',
      })

      await Promise.all([
        mutate(
          `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=end-date&sort-order=desc`
        ),
        mutate(
          `/api/v1/user-bike/bike/${bikeId}/tourings?status=PLANNED&sort-by=start-date&sort-order=asc`
        ),
      ])

      toast.success(
        isPlan
          ? 'ツーリングプランを保存しました'
          : 'ツーリング履歴を登録しました',
        { description: 'ツーリング一覧へ移動します。' }
      )
      router.push(`/app/my-bike/${bikeId}/tourings`)
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
          onClick={() => router.push(`/app/my-bike/${bikeId}/tourings`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard title="ツーリングを登録">
        <TouringForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      </BaseCard>
    </>
  )
}

export default withAuth(TouringRegisterPage)
