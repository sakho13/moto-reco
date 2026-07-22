'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { FooterCard } from '@/components/FooterCard'
import { LogoutButton } from '@/components/Navigation/LogoutButton'
import { ProfileCard } from '@/components/ProfileCard'
import { apiGet } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useAuth } from '@/lib/hooks/useAuth'

function ProfileEditPage() {
  const { isGuest } = useAuth()

  const { data } = useSWR('/api/v1/user/profile', async (url) => {
    const response = await apiGet(url)
    return response.data
  })
  const isAdmin = data?.role === 'ADMIN'

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <ProfileCard />

      <BaseCard title="オプション">
        <div className="flex flex-col">
          <Link
            href="/app/profile/account"
            className="flex justify-between items-center text-sm py-2 border-b last:border-b-0"
          >
            <span>認証情報</span>
            <span style={{ color: 'var(--color-muted-foreground)' }}>›</span>
          </Link>
          {isAdmin && (
            <Link
              href="/app/photos"
              className="flex justify-between items-center text-sm py-2 border-b last:border-b-0"
            >
              <span>フォト</span>
              <span style={{ color: 'var(--color-muted-foreground)' }}>›</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/app/admin/system-api-keys"
              className="flex justify-between items-center text-sm py-2 border-b last:border-b-0"
            >
              <span>システムAPIキー管理</span>
              <span style={{ color: 'var(--color-muted-foreground)' }}>›</span>
            </Link>
          )}
          {!isGuest && (
            <Link
              href="/app/profile/plan"
              className="flex justify-between items-center text-sm py-2 border-b last:border-b-0"
            >
              <span>プラン</span>
              <span style={{ color: 'var(--color-muted-foreground)' }}>›</span>
            </Link>
          )}
          {!isGuest && (
            <Link
              href="/app/settings/api-keys"
              className="flex justify-between items-center text-sm py-2 border-b last:border-b-0"
            >
              <span>MCP APIキー管理</span>
              <span style={{ color: 'var(--color-muted-foreground)' }}>›</span>
            </Link>
          )}
        </div>
      </BaseCard>

      <LogoutButton />

      <FooterCard />
    </div>
  )
}

export default withAuth(ProfileEditPage)
