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

    try {
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/tourings`, {
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
      toast.success('ツーリング履歴を登録しました', {
        description: 'ツーリング履歴一覧へ移動します。',
      })
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

      <BaseCard title="ツーリング履歴を登録">
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
