import { BikeIcon } from '@/components/icons/BikeIcon'
import { HomeIcon } from '@/components/icons/HomeIcon'
import { ProfileIcon } from '@/components/icons/ProfileIcon'
import { TouringIcon } from '@/components/icons/TouringIcon'

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
    id: 'tourings',
    label: 'ツーリング記録',
    href: '/app/tourings',
    icon: TouringIcon,
  },
  {
    id: 'profile',
    label: 'プロフィール',
    href: '/app/profile',
    icon: ProfileIcon,
  },
]
