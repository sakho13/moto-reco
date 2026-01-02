'use client'

import styles from './Footer.module.css'

export function Footer() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev'

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p className={styles.text}>Created by SaKho</p>
        <p className={styles.text}>@2025 MotoReco</p>
        <p className={styles.version}>ver {version}</p>
      </div>
    </footer>
  )
}
