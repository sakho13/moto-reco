import { DocsSidebar } from './DocsSidebar'
import styles from './layout.module.css'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <DocsSidebar />
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
