'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { TouringForm, type TouringFormData } from '@/components/touring/TouringForm'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringRegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bikeId = searchParams.get('bikeId') ?? ''
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFormSubmit = async (formData: TouringFormData) => {
    if (!bikeId) {
      setError('バイクIDが不正です')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await apiPost(`/api/v1/user-bike/bike/${bikeId}/tourings`, {
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

      toast.success('ツーリング記録を登録しました', {
        description: 'ツーリング記録一覧へ移動します。',
      })
      router.push(`/app/tourings?bikeId=${bikeId}`)
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <div className="w-full">
        <Button
          onClick={() => router.push(`/app/tourings?bikeId=${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <BaseCard title="ツーリング記録を登録">
        <TouringForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      </BaseCard>
    </div>
  )
}

export default withAuth(TouringRegisterPage)
