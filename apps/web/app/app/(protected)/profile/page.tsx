'use client'

import { BaseCard } from '@repo/ui/baseCard'
import { FooterCard } from '@/components/FooterCard'
import { LogoutButton } from '@/components/Navigation/LogoutButton'
import { ProfileCard } from '@/components/ProfileCard'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'

const PROVIDER_LABEL: Record<string, string> = {
  password: 'メール/パスワード',
  'google.com': 'Google',
}

function ProfileEditPage() {
  const { user } = useAuth()

  const providerLabel =
    user?.providerData[0]?.providerId != null
      ? (PROVIDER_LABEL[user.providerData[0].providerId] ??
        user.providerData[0].providerId)
      : '-'

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <ProfileCard />

      <BaseCard title="アカウント認証">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">認証方式</span>
            <span>{providerLabel}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">メールアドレス</span>
            <span>{user?.email ?? '-'}</span>
          </div>
        </div>
      </BaseCard>

      <LogoutButton />

      <FooterCard />
    </div>
  )
}

export default withAuth(ProfileEditPage)
