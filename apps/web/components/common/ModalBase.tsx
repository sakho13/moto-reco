'use client'

import { useEffect } from 'react'
import styles from './ModalBase.module.css'
import { XIcon } from '@/components/icons/XIcon'

// ネストしたモーダルで scroll lock が解除されないようカウンタで管理する
let scrollLockCount = 0
let savedScrollY = 0

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
    if (scrollLockCount === 0) {
      savedScrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${savedScrollY}px`
      document.body.style.width = '100%'
    }
    scrollLockCount++
    return () => {
      scrollLockCount--
      if (scrollLockCount === 0) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, savedScrollY)
      }
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
