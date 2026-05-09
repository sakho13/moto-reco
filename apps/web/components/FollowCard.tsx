'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { apiGet } from '@/lib/api/client'

export function FollowCard() {
  const { data: profile } = useSWR('/api/v1/user/profile', async (url) => {
    const res = await apiGet(url)
    return res.data
  })

  const { data: pageData } = useSWR(
    profile?.userId ? [`publicPage`, profile.userId] : null,
    async () => {
      const res = await apiGet(
        `/api/v1/user/${profile!.userId}/page` as `/api/v1/user/${string}/page`
      )
      return res.data
    }
  )

  const followerCount = pageData?.followerCount ?? '--'
  const followingCount = pageData?.followingCount ?? '--'

  return (
    <BaseCard
      title="フォロー"
      headerAction={
        <Link
          href="/app/search"
          className="text-sm text-blue-500 hover:underline"
        >
          ユーザーを探す
        </Link>
      }
    >
      <div className="flex gap-6 text-sm">
        <Link
          href={
            profile?.userId ? `/app/users/${profile.userId}?tab=followers` : '#'
          }
          className="flex flex-col items-center gap-0.5 hover:opacity-70"
        >
          <span className="text-xl font-bold text-gray-900">
            {followerCount}
          </span>
          <span className="text-gray-500">フォロワー</span>
        </Link>
        <Link
          href={
            profile?.userId ? `/app/users/${profile.userId}?tab=following` : '#'
          }
          className="flex flex-col items-center gap-0.5 hover:opacity-70"
        >
          <span className="text-xl font-bold text-gray-900">
            {followingCount}
          </span>
          <span className="text-gray-500">フォロー中</span>
        </Link>
      </div>
    </BaseCard>
  )
}
