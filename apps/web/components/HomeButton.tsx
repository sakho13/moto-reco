'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { HomeIcon } from '@/components/icons/HomeIcon'

export function HomeButton() {
  const router = useRouter()
  const pathname = usePathname()

  const isOnHomePage = pathname === '/home'

  const handleClick = () => {
    if (!isOnHomePage) {
      router.push('/home')
    }
  }

  return (
    <Button
      type="button"
      variant="cloud"
      size="sm"
      disabled={isOnHomePage}
      aria-label="ホームに戻る"
      aria-disabled={isOnHomePage}
      onClick={handleClick}
    >
      <HomeIcon />
    </Button>
  )
}
