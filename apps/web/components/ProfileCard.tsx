'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { EditIcon } from '@/components/icons/EditIcon'
import { ProfileEditModal } from '@/components/ProfileEditModal'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

export function ProfileCard() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/user/profile',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isLoading) {
    return (
      <BaseCard title="プロフィール">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </BaseCard>
    )
  }

  if (error) {
    const errorMessage =
      error instanceof ApiV1Error
        ? error.message
        : 'プロフィールの取得に失敗しました'

    return (
      <BaseCard title="プロフィール">
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <Button onClick={() => mutate()}>再試行</Button>
      </BaseCard>
    )
  }

  return (
    <>
      <BaseCard
        title="プロフィール"
        headerAction={
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="cloud"
            size="sm"
            aria-label="プロフィールを編集"
          >
            <EditIcon />
          </Button>
        }
      >
        <div>
          <p>名前: {data?.name || '未設定'}</p>
          <p>通知メールアドレス: {data?.notificationEmail || '未設定'}</p>
        </div>
      </BaseCard>

      {isModalOpen && data && (
        <ProfileEditModal
          initialName={data.name}
          initialNotificationEmail={data.notificationEmail}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(updated) => {
            mutate({ ...data, ...updated })
            setIsModalOpen(false)
          }}
        />
      )}
    </>
  )
}
