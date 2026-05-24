import { GuestBanner } from '@/components/GuestBanner'
import { BreadcrumbNav } from '@/components/Navigation/BreadcrumbNav'
import { DesktopSidebar } from '@/components/Navigation/DesktopSidebar'
import { MobileHeader } from '@/components/Navigation/MobileHeader'
import { MobileNavigation } from '@/components/Navigation/MobileNavigation'
import { BellButton } from '@/components/notification/BellButton'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <>
      <MobileHeader />
      <DesktopSidebar />
      <MobileNavigation />

      {/* デスクトップ右上: ベル + テーマ切替 (モバイルは MobileHeader が担当) */}
      <div className="hidden sm:flex fixed top-4 right-4 z-50 items-center gap-2">
        <BellButton />
        <ThemeToggleButton />
      </div>

      <div className="min-h-screen w-full flex flex-col items-center p-4 gap-6 pt-16 pb-20 sm:pt-4 sm:pb-4 sm:pl-24">
        <BreadcrumbNav />
        <GuestBanner />
        {children}
      </div>
    </>
  )
}
