'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@packages/ui/button'
import { ProfileCard } from '@/components/ProfileCard'
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
    <div>
      <div>
        <h1>ホームページ</h1>
      </div>

      <div>
        <ProfileCard />
      </div>

      <div>
        <Button onClick={handleLogout}>ログアウト</Button>
      </div>
    </div>
  )
}

export default withAuth(Page)
