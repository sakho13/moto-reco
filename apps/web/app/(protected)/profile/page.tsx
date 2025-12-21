'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@packages/ui/button'
import { ProfileCard } from '@/components/ProfileCard'
import { withAuth } from '@/lib/hoc/withAuth'

function ProfileEditPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-6">
        <Button variant="cloud" onClick={() => router.back()}>
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <ProfileCard />
      </div>
    </div>
  )
}

export default withAuth(ProfileEditPage)
