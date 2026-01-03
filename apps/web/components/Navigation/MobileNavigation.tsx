'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './MobileNavigation.module.css'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'
import { MenuIcon } from '@/components/icons/MenuIcon'
import { XIcon } from '@/components/icons/XIcon'

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const closeDropdown = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef}>
      <button
        className={styles.hamburgerButton}
        onClick={toggleDropdown}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
      >
        {isOpen ? <XIcon /> : <MenuIcon />}
      </button>

      <nav
        className={`${styles.dropdown} ${isOpen ? styles.open : ''}`}
        aria-label="メインナビゲーション"
      >
        {navigationItems.map((item) => (
          <NavigationButton
            key={item.id}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>
    </div>
  )
}
