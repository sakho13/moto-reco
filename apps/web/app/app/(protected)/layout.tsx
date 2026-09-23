import styles from './layout.module.css'
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
      <div className={styles.appRoot}>
        <MobileHeader />
        <DesktopHeader />
        <DesktopSidebar />
        <MobileNavigation />

        <div className={styles.shell}>
          <div className={styles.page}>
            <GuestBanner />
            {children}
          </div>
        </div>
      </div>
    </ActiveBikeProvider>
  )
}
