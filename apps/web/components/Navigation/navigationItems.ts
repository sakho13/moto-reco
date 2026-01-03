import { BikeIcon } from '@/components/icons/BikeIcon'
import { HomeIcon } from '@/components/icons/HomeIcon'
import { ProfileIcon } from '@/components/icons/ProfileIcon'

export type NavigationItem = {
  id: string
  label: string
  href: string
  icon: React.ComponentType
}

export const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'ホーム', href: '/home', icon: HomeIcon },
  { id: 'my-bike', label: 'マイバイク', href: '/my-bike', icon: BikeIcon },
  { id: 'profile', label: 'プロフィール', href: '/profile', icon: ProfileIcon },
]
