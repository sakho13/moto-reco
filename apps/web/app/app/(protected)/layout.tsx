import { GuestBanner } from '@/components/GuestBanner'
import { DesktopHeader } from '@/components/Navigation/DesktopHeader'
import { DesktopSidebar } from '@/components/Navigation/DesktopSidebar'
import { MobileHeader } from '@/components/Navigation/MobileHeader'
import { MobileNavigation } from '@/components/Navigation/MobileNavigation'

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
      <DesktopSidebar />
      <MobileNavigation />

      <div className="min-h-screen w-full flex flex-col items-center p-4 gap-6 pt-16 pb-20 sm:pt-12 sm:pb-4 sm:pl-24">
        <GuestBanner />
        {children}
      </div>
    </>
  )
}
