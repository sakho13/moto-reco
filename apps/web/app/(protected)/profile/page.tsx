'use client'

import { ProfileCard } from '@/components/ProfileCard'
import { withAuth } from '@/lib/hoc/withAuth'

function ProfileEditPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ProfileCard />
      </div>
    </div>
  )
}

export default withAuth(ProfileEditPage)
