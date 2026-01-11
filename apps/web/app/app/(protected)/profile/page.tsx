'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { LogoutButton } from '@/components/Navigation/LogoutButton'
import { ProfileCard } from '@/components/ProfileCard'
import { withAuth } from '@/lib/hoc/withAuth'

function ProfileEditPage() {
  const router = useRouter()

  return (
    <>
      <div className="w-full max-w-md">
        <Button variant="cloud" onClick={() => router.back()}>
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <ProfileCard />
        <LogoutButton />
      </div>
    </>
  )
}

export default withAuth(ProfileEditPage)
