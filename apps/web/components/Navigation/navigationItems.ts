import { BikeIcon } from '@/components/icons/BikeIcon'
import { HistoryIcon } from '@/components/icons/HistoryIcon'
import { HomeIcon } from '@/components/icons/HomeIcon'
import { ProfileIcon } from '@/components/icons/ProfileIcon'

export type NavigationItem = {
  id: string
  label: string
  href: string
  icon: React.ComponentType
}

export const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'ホーム', href: '/app/home', icon: HomeIcon },
  { id: 'my-bike', label: 'マイバイク', href: '/app/my-bike', icon: BikeIcon },
  {
    id: 'history',
    label: 'ヒストリー',
    href: '/app/history',
    icon: HistoryIcon,
  },
  {
    id: 'profile',
    label: 'プロフィール',
    href: '/app/profile',
    icon: ProfileIcon,
  },
]
