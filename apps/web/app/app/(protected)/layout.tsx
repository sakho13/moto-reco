import { BreadcrumbNav } from '@/components/Navigation/BreadcrumbNav'
import { DesktopSidebar } from '@/components/Navigation/DesktopSidebar'
import { MobileNavigation } from '@/components/Navigation/MobileNavigation'

type Props = {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <>
      <DesktopSidebar />
      <MobileNavigation />

      <div className="min-h-screen w-full flex flex-col items-center p-4 gap-6 pb-24 sm:pb-4">
        <BreadcrumbNav />
        {children}
      </div>
    </>
  )
}
