'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { LogOutIcon } from '@/components/icons/LogOutIcon'
import { trackEvent } from '@/lib/analytics'
import { useAuth } from '@/lib/hooks/useAuth'

export function LogoutButton() {
  const router = useRouter()
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut()
      trackEvent('web_logout')
      router.push('/app/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="danger"
      outline
      fullWidth
      disabled={isLoading}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LogOutIcon />
        {isLoading ? 'ログアウト中...' : 'ログアウト'}
      </span>
    </Button>
  )
}
