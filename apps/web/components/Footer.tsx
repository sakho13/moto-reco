'use client'

import styles from './Footer.module.css'
import { APP_VERSION } from '@/lib/statics'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p className={styles.text}>Created by SaKho</p>
        <p className={styles.text}>@2025 MotoReco</p>
        <p className={styles.version}>ver {APP_VERSION}</p>
      </div>
    </footer>
  )
}
