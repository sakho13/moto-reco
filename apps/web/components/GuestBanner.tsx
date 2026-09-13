'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import styles from './GuestBanner.module.css'
import { useAuth } from '@/lib/hooks/useAuth'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

/**
 * ゲストアカウント利用中に表示するバナー
 * 有効期限の残り日数と本登録への誘導を表示する
 */
export function GuestBanner() {
  const { isGuest, user, signOut } = useAuth()
  const router = useRouter()

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
    <div className={styles.banner}>
      <div className={styles.textContainer}>
        <span className={styles.title}>ゲストモードで利用中</span>
        <span className={styles.description}>
          {daysLeft !== null
            ? `有効期限まで残り${daysLeft}日 • バイク1台・給油5件・ツーリング2件まで`
            : 'バイク1台・給油5件・ツーリング2件まで'}
        </span>
      </div>
      <Button
        variant="primary"
        size="sm"
        className={styles.action}
        onClick={async () => {
          await signOut()
          router.push('/app/register')
        }}
      >
        ログアウトして本登録する
      </Button>
    </div>
  )
}
