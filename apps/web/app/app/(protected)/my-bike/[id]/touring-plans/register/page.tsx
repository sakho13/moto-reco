'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { mutate } from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import {
  TouringPlanForm,
  type TouringPlanFormData,
} from '@/components/touring/TouringPlanForm'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringPlanRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const bikeId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFormSubmit = async (formData: TouringPlanFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const response = await apiPost(
        `/api/v1/user-bike/bike/${bikeId}/touring-plans`,
        {
          title: formData.title,
        }
      )

      await mutate(`/api/v1/user-bike/bike/${bikeId}/touring-plans`)

      toast.success('ツーリングプランを作成しました', {
        description: 'プラン詳細へ移動します。',
      })
      router.push(
        `/app/my-bike/${bikeId}/touring-plans/${response.data.touringPlanId}`
      )
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
          onClick={() => router.push(`/app/my-bike/${bikeId}/touring-plans`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard title="ツーリングプランを作成">
        <TouringPlanForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      </BaseCard>
    </>
  )
}

export default withAuth(TouringPlanRegisterPage)
