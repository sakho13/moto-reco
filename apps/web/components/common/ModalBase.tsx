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
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
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
