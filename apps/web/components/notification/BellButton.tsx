'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './BellButton.module.css'
import { NotificationDropdown } from './NotificationDropdown'
import { useNotificationUnreadCount } from '@/lib/hooks/useNotifications'

export function BellButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, mutate } = useNotificationUnreadCount()
  const ref = useRef<HTMLDivElement>(null)

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleOpen() {
    setIsOpen((prev) => !prev)
  }

  function handleClose() {
    setIsOpen(false)
    mutate()
  }

  return (
    <div ref={ref} className={styles.container}>
      <button
        type="button"
        className={styles.bell}
        onClick={handleOpen}
        aria-label={`通知${unreadCount > 0 ? `（未読${unreadCount}件）` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown onClose={handleClose} />}
    </div>
  )
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
