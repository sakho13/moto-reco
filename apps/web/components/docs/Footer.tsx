'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Footer.module.css'
import { GOOGLE_QA_FORM_URL } from '@/lib/statics'

export function Footer() {
  const pathname = usePathname()

  if (pathname === '/api-doc') {
    return null
  }

  return (
    <footer className={styles.footer}>
      <div>
        <p>moto-reco Documentation</p>
        <span>プロダクトの詳細は随時更新されます。</span>
      </div>
      <Link
        href={GOOGLE_QA_FORM_URL}
        target="_blank"
        rel="noreferrer"
        className={styles.feedbackLink}
        aria-label="アンケートを新しいタブで開く"
      >
        ご意見・ご要望はこちら
      </Link>
    </footer>
  )
}
