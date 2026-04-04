'use client'

import { useRouter } from 'next/navigation'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { LogoutButton } from '@/components/Navigation/LogoutButton'
import { ProfileCard } from '@/components/ProfileCard'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'

const PROVIDER_LABEL: Record<string, string> = {
  password: 'メール/パスワード',
  'google.com': 'Google',
}

function ProfileEditPage() {
  const router = useRouter()
  const { user } = useAuth()

  const providerLabel =
    user?.providerData[0]?.providerId != null
      ? (PROVIDER_LABEL[user.providerData[0].providerId] ??
        user.providerData[0].providerId)
      : '-'

  return (
    <>
      <div className="w-full max-w-md">
        <Button variant="cloud" onClick={() => router.back()}>
          ← 戻る
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <ProfileCard />
        <BaseCard title="アカウント">
          <div className="flex flex-col gap-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">認証方式</span>
              <span>{providerLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">メールアドレス</span>
              <span>{user?.email ?? '-'}</span>
            </div>
          </div>
          <LogoutButton />
        </BaseCard>
      </div>
    </>
  )
}

export default withAuth(ProfileEditPage)
