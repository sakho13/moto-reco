'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

/**
 * ゲストアカウント利用中に表示するバナー
 * 有効期限の残り日数と本登録への誘導を表示する
 */
export function GuestBanner() {
  const { isGuest, user } = useAuth()

  if (!isGuest || !user) return null

  // ゲストアカウントの有効期限を計算（createdAt + 7日）
  const createdAt = user.metadata.creationTime
    ? new Date(user.metadata.creationTime)
    : null
  const expiresAt = createdAt
    ? new Date(createdAt.getTime() + GUEST_ACCOUNT_LIMITS.TTL_MS)
    : null
  const daysLeft = expiresAt
    ? Math.max(
        0,
        Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null

  return (
    <div className="w-full max-w-2xl bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-center justify-between gap-4 text-sm">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-amber-800">
          ゲストモードで利用中
        </span>
        <span className="text-amber-700">
          {daysLeft !== null
            ? `有効期限まで残り${daysLeft}日 • バイク1台・給油5件・ツーリング2件まで`
            : 'バイク1台・給油5件・ツーリング2件まで'}
        </span>
      </div>
      <Link
        href="/app/upgrade"
        className="shrink-0 bg-amber-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-amber-700 transition-colors"
      >
        本登録する
      </Link>
    </div>
  )
}
