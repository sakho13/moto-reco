'use client'

import Link from 'next/link'
import styles from './Footer.module.css'
import { APP_VERSION, GOOGLE_QA_FORM_URL } from '@/lib/statics'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
         <Link
          href={GOOGLE_QA_FORM_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.feedbackLink}
          aria-label="アンケートを新しいタブで開く"
        >
          ご意見・ご要望はこちら
        </Link>
        <div className={styles.info}>
          <p className={styles.text}>Created by SaKho</p>
          <p className={styles.text}>@2025 MotoReco</p>
          <p className={styles.version}>ver {APP_VERSION}</p>
        </div>

      </div>
    </footer>
  )
}
