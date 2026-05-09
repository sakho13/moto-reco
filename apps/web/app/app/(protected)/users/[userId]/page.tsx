'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import styles from './page.module.css'
import { HistoryItemCard } from '@/components/history/HistoryItemCard'
import { apiDelete, apiGet, apiPost } from '@/lib/api/client'

type Tab = 'timeline' | 'bikes' | 'followers' | 'following'

const VALID_TABS: Tab[] = ['timeline', 'bikes', 'followers', 'following']

function toTab(value: string | null): Tab {
  return VALID_TABS.includes(value as Tab) ? (value as Tab) : 'timeline'
}

function UserPageContent() {
  const params = useParams()
  const userId = params.userId as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = toTab(searchParams.get('tab'))
  const [followLoading, setFollowLoading] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/user/${userId}/page`,
    async (url) => (await apiGet(url as `/api/v1/user/${string}/page`)).data
  )

  const { data: myProfile } = useSWR(
    '/api/v1/user/profile',
    async (url) => (await apiGet(url)).data
  )

  const { data: followersData } = useSWR(
    activeTab === 'followers' ? ['followers', userId] : null,
    async () =>
      (
        await apiGet(
          `/api/v1/user/${userId}/followers` as `/api/v1/user/${string}/followers`
        )
      ).data
  )

  const { data: followingData } = useSWR(
    activeTab === 'following' ? ['following', userId] : null,
    async () =>
      (
        await apiGet(
          `/api/v1/user/${userId}/following` as `/api/v1/user/${string}/following`
        )
      ).data
  )

  const isOwnProfile = myProfile?.userId === userId

  const changeTab = (tab: Tab) => {
    router.replace(`/app/users/${userId}?tab=${tab}`, { scroll: false })
  }

  const handleFollow = async () => {
    if (!data || followLoading) return
    setFollowLoading(true)
    try {
      if (data.isFollowing) {
        await apiDelete(
          `/api/v1/user/${userId}/follow` as `/api/v1/user/${string}/follow`
        )
      } else {
        await apiPost(
          `/api/v1/user/${userId}/follow` as `/api/v1/user/${string}/follow`,
          {}
        )
      }
      await mutate()
    } finally {
      setFollowLoading(false)
    }
  }

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error)
    return <ErrorMessage>プロフィールの取得に失敗しました</ErrorMessage>
  if (!data) return null

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'timeline', label: 'タイムライン' },
    { key: 'bikes', label: 'バイク', count: data.bikes.length },
    { key: 'followers', label: 'フォロワー', count: data.followerCount },
    { key: 'following', label: 'フォロー中', count: data.followingCount },
  ]

  const activeTabLabel = tabs.find((t) => t.key === activeTab)?.label ?? ''

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <BaseCard
        title={data.name}
        headerAction={
          !isOwnProfile && myProfile ? (
            <Button
              variant={data.isFollowing ? 'cloud' : 'primary'}
              size="sm"
              loading={followLoading}
              onClick={handleFollow}
            >
              {data.isFollowing ? 'フォロー中' : 'フォロー'}
            </Button>
          ) : undefined
        }
      >
        <div className={styles.followStats}>
          <button
            className={styles.followStatButton}
            onClick={() => changeTab('followers')}
          >
            <span className={styles.followStatCount}>{data.followerCount}</span>{' '}
            フォロワー
          </button>
          <button
            className={styles.followStatButton}
            onClick={() => changeTab('following')}
          >
            <span className={styles.followStatCount}>
              {data.followingCount}
            </span>{' '}
            フォロー中
          </button>
        </div>
      </BaseCard>

      <BaseCard title={activeTabLabel}>
        <nav className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => changeTab(tab.key)}
              className={
                activeTab === tab.key
                  ? `${styles.tabButton} ${styles.tabButtonActive}`
                  : styles.tabButton
              }
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={styles.tabCount}>{tab.count}</span>
              )}
            </button>
          ))}
        </nav>

        {activeTab === 'timeline' && (
          <div className={styles.tabContent}>
            {data.histories.length === 0 ? (
              <p className={styles.emptyMessage}>ヒストリーがありません</p>
            ) : (
              data.histories.map((item, idx) => (
                <div
                  key={`${item.type}-${item.occurredAt}-${idx}`}
                  className={styles.tabItem}
                >
                  <HistoryItemCard item={item} />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'bikes' && (
          <div className={styles.tabContent}>
            {data.bikes.length === 0 ? (
              <p className={styles.emptyMessage}>公開バイクがありません</p>
            ) : (
              data.bikes.map((bike) => (
                <div key={bike.myUserBikeId} className={styles.tabItem}>
                  <p className={styles.bikeName}>
                    {bike.nickname || bike.modelName || 'バイク'}
                  </p>
                  <p className={styles.bikeManufacturer}>
                    {bike.manufacturerName || 'メーカー不明'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className={styles.tabContent}>
            {!followersData ? (
              <p className={styles.loadingMessage}>読み込み中...</p>
            ) : followersData.users.length === 0 ? (
              <p className={styles.emptyMessage}>フォロワーがいません</p>
            ) : (
              followersData.users.map((u) => (
                <Link
                  key={u.userId}
                  href={`/app/users/${u.userId}`}
                  className={styles.userLink}
                >
                  <div className={styles.userAvatar}>{u.name.charAt(0)}</div>
                  <span className={styles.userName}>{u.name}</span>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className={styles.tabContent}>
            {!followingData ? (
              <p className={styles.loadingMessage}>読み込み中...</p>
            ) : followingData.users.length === 0 ? (
              <p className={styles.emptyMessage}>
                フォロー中のユーザーがいません
              </p>
            ) : (
              followingData.users.map((u) => (
                <Link
                  key={u.userId}
                  href={`/app/users/${u.userId}`}
                  className={styles.userLink}
                >
                  <div className={styles.userAvatar}>{u.name.charAt(0)}</div>
                  <span className={styles.userName}>{u.name}</span>
                </Link>
              ))
            )}
          </div>
        )}
      </BaseCard>
    </div>
  )
}

export default function UserPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <UserPageContent />
    </Suspense>
  )
}
