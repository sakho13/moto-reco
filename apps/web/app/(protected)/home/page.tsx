'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@packages/ui/button'
import { NavigationCard } from '@/components/NavigationCard'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'

function Page() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* ナビゲーションカードセクション */}
      <div className="w-full max-w-md flex flex-col gap-4">
        <NavigationCard
          href="/profile"
          title="プロフィール編集"
          description="あなたのプロフィール情報を更新できます"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />
      </div>

      {/* ログアウトボタン */}
      <div className="w-full max-w-md">
        <Button onClick={handleLogout} fullWidth>
          ログアウト
        </Button>
      </div>
    </>
  )
}

export default withAuth(Page)
