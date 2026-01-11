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

      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
        {children}
      </div>
    </>
  )
}
