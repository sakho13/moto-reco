'use client'

import { useEffect } from 'react'
import styles from './ModalBase.module.css'
import { XIcon } from '@/components/icons/XIcon'

interface ModalBaseProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: 'md' | 'sm'
}

export function ModalBase({
  title,
  onClose,
  children,
  size = 'md',
}: ModalBaseProps) {
  useEffect(() => {
    // iOS Safari では overflow:hidden だけではスクロールが止まらないため
    // position:fixed + top で完全にスクロールをロックする
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${size === 'sm' ? styles.modalSm : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
