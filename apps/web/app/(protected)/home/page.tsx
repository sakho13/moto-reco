'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@packages/ui/button'
import { ProfileIcon } from '@/components/icons/ProfileIcon'
import { MyBikeListSection } from '@/components/MyBikeListSection'
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
      {/* マイバイク一覧セクション */}
      <div className="w-full max-w-lg">
        <MyBikeListSection />
      </div>

      {/* ナビゲーションカードセクション */}
      <div className="w-full max-w-md flex flex-col gap-4">
        <NavigationCard
          href="/profile"
          title="プロフィール編集"
          description="あなたのプロフィール情報を更新できます"
          icon={<ProfileIcon />}
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
