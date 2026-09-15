'use client'

import { ChevronDown, Motorbike as BikeIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import styles from './BikeSwitcher.module.css'
import { getBikeDisplayMeta, getBikeDisplayName } from '@/lib/bike'
import { useActiveBike } from '@/lib/hooks/useActiveBike'

/**
 * ヘッダーに置くアクティブ車両の表示・切り替えUI
 *
 * @remarks
 * - バイク未登録: 何も表示しない
 * - バイク1台: 切り替えUIを出さず車両名のみ表示する
 * - バイク2台以上: タップでドロップダウンを開き、アクティブ車両を切り替えられる
 */
export function BikeSwitcher() {
  const { bikes, activeBike, setActiveBikeId, isLoading } = useActiveBike()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isLoading || !activeBike || bikes.length === 0) {
    return null
  }

  const activeBikeName = getBikeDisplayName(activeBike)

  // バイクが1台のみの場合は切り替えUIを出さず、名称のみ表示する
  if (bikes.length === 1) {
    return (
      <div
        className={styles.singleLabel}
        title={getBikeDisplayMeta(activeBike)}
      >
        <BikeIcon size={16} strokeWidth={2} aria-hidden="true" />
        <span className={styles.name}>{activeBikeName}</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <Button
        type="button"
        variant="cloud"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`アクティブ車両: ${activeBikeName}。タップして車両を切り替える`}
        className={styles.trigger}
      >
        <span className={styles.triggerContent}>
          <BikeIcon size={16} strokeWidth={2} aria-hidden="true" />
          <span className={styles.name}>{activeBikeName}</span>
          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
        </span>
      </Button>

      {isOpen && (
        <ul className={styles.dropdown} role="listbox">
          {bikes.map((bike) => {
            const isActive = bike.myUserBikeId === activeBike.myUserBikeId

            return (
              <li key={bike.myUserBikeId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                  onClick={() => {
                    setActiveBikeId(bike.myUserBikeId)
                    setIsOpen(false)
                  }}
                >
                  <span className={styles.optionName}>
                    {getBikeDisplayName(bike)}
                  </span>
                  <span className={styles.optionMeta}>
                    {getBikeDisplayMeta(bike)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
