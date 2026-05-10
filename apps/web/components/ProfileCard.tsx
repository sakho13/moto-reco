'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import styles from './ProfileCard.module.css'
import { EditIcon } from '@/components/icons/EditIcon'
import { ProfileEditModal } from '@/components/ProfileEditModal'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { useAuth } from '@/lib/hooks/useAuth'

export function ProfileCard() {
  const { isGuest } = useAuth()

  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/user/profile',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const { data: pageData } = useSWR(
    data?.userId && data?.isProfilePublic ? ['publicPage', data.userId] : null,
    async () => {
      const res = await apiGet(
        `/api/v1/user/${data!.userId}/page` as `/api/v1/user/${string}/page`
      )
      return res.data
    }
  )

  const followerCount = pageData?.followerCount ?? '--'
  const followingCount = pageData?.followingCount ?? '--'

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
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">名前</span>
            <span>{data?.name || '未設定'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">通知メールアドレス</span>
            <span>{data?.notificationEmail || '未設定'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">プロフィール公開</span>
            <span>{data?.isProfilePublic ? '公開' : '非公開'}</span>
          </div>
          {data?.isProfilePublic && (
            <div className="pt-1">
              <Link
                href={`/app/users/${data.userId}`}
                className="text-blue-500 hover:underline"
              >
                自分の公開ページを見る →
              </Link>
            </div>
          )}
        </div>
        {!isGuest && (
          <>
            <hr className="divider" />
            <div className={styles.followSection}>
              <div className={styles.followItem}>
                <span className={styles.followCount}>{followerCount}</span>
                <span className={styles.followLabel}>フォロワー</span>
              </div>
              <div className={styles.followItem}>
                <span className={styles.followCount}>{followingCount}</span>
                <span className={styles.followLabel}>フォロー中</span>
              </div>
            </div>
          </>
        )}
      </BaseCard>

      {isModalOpen && data && (
        <ProfileEditModal
          initialName={data.name}
          initialNotificationEmail={data.notificationEmail}
          initialIsProfilePublic={data.isProfilePublic}
          isGuest={isGuest}
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
