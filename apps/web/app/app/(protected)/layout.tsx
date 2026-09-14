import { GuestBanner } from '@/components/GuestBanner'
import { DesktopHeader } from '@/components/Navigation/DesktopHeader'
import { DesktopSidebar } from '@/components/Navigation/DesktopSidebar'
import { MobileHeader } from '@/components/Navigation/MobileHeader'
import { MobileNavigation } from '@/components/Navigation/MobileNavigation'
import { ActiveBikeProvider } from '@/lib/contexts/ActiveBikeContext'

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <ActiveBikeProvider>
      <MobileHeader />
      <DesktopHeader />
      <DesktopSidebar />
      <MobileNavigation />

      <div className="min-h-screen w-full flex flex-col items-center p-4 gap-6 pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pt-16 sm:pb-4 sm:pl-24">
        <GuestBanner />
        {children}
      </div>
    </ActiveBikeProvider>
  )
}
