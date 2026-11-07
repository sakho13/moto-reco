'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * モバイルの全画面地図の開閉を、ブラウザの履歴と連動させる
 *
 * @remarks
 * 開くときに履歴を積むので、ブラウザの「戻る」は画面を離れずに地図だけを閉じる。
 * PC幅では地図を常に並べるので、開いたまま広げられたら閉じる。
 */
export function useMapPanel(isDesktop: boolean): {
  isOpen: boolean
  open: () => void
  close: () => void
} {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handlePopState = () => setIsOpen(false)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen])

  useEffect(() => {
    if (isDesktop && isOpen) window.history.back()
  }, [isDesktop, isOpen])

  const open = useCallback(() => {
    window.history.pushState(null, '')
    setIsOpen(true)
  }, [])

  const close = useCallback(() => window.history.back(), [])

  return { isOpen, open, close }
}
