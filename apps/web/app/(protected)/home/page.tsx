'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { BikeIcon } from '@/components/icons/BikeIcon'
import { ProfileIcon } from '@/components/icons/ProfileIcon'
import { NavigationCard } from '@/components/NavigationCard'
import { QuickFuelSection } from '@/components/QuickFuelSection'
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
      {/* 給油登録セクション */}
      <div className="w-full max-w-lg">
        <QuickFuelSection />
      </div>

      {/* ナビゲーションカードセクション */}
      <div className="w-full max-w-md flex flex-col gap-4">
        <NavigationCard
          href="/my-bike"
          title="マイバイク"
          description="あなたのバイク一覧を表示します"
          icon={<BikeIcon />}
        />

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
