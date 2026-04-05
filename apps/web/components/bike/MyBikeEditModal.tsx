'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { XIcon } from '@/components/icons/XIcon'
import { authenticatedFetch, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { MyBikeEditForm, type MyBikeEditFormData } from './MyBikeEditForm'
import styles from './MyBikeEditModal.module.css'

interface MyBikeEditModalProps {
  bikeId: string
  onClose: () => void
  onSuccess: () => void
}

export function MyBikeEditModal({
  bikeId,
  onClose,
  onSuccess,
}: MyBikeEditModalProps) {
  const [initialData, setInitialData] = useState<MyBikeEditFormData | null>(
    null
  )
  const [isDisplacementEditable, setIsDisplacementEditable] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useSWR(
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
    if (!data) return
    setInitialData({
      nickname: data.nickname ?? '',
      totalMileage: data.totalMileage.toString(),
      displacement: data.displacement.toString(),
      isPublic: data.isPublic,
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
        isPublic: formData.isPublic,
      })

      await Promise.all([
        mutate(`/api/v1/user-bike/bike/${bikeId}`),
        mutate('/api/v1/user-bike/bikes'),
      ])
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className="text-lg font-semibold">マイバイク情報を編集</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </button>
        </div>

        {isLoading && <p>読み込み中...</p>}

        {!isLoading && initialData && (
          <MyBikeEditForm
            initialData={initialData}
            isDisplacementEditable={isDisplacementEditable}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </div>
    </div>
  )
}
