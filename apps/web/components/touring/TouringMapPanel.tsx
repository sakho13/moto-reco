'use client'

import { ChevronLeft, ExternalLink, MapPin } from 'lucide-react'
import { useEffect, useRef } from 'react'
import styles from './TouringMapPanel.module.css'
import type { MapPoint } from './TouringRouteMap'
import TouringRouteMap from './TouringRouteMap'
import { TouringStone } from './TouringStone'
import type { Journey } from '@/lib/utils/touringJourney'
import {
  formatDuration,
  formatStayTime,
  getStoneShape,
} from '@/lib/utils/touringJourney'

type Props = {
  journey: Journey
  points: MapPoint[]
  focusedId: string | null
  onFocus: (nodeId: string) => void
  onClose: () => void
}

/**
 * モバイルの全画面地図
 *
 * @remarks
 * 地図のピンと石の列は同じ番号で連動する。座標のない地点は石の列にだけ出る。
 */
export function TouringMapPanel({
  journey,
  points,
  focusedId,
  onFocus,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const backButtonRef = useRef<HTMLButtonElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    backButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex="0"]'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (!panelRef.current.contains(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first)?.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const focused =
    journey.nodes.find((node) => node.id === focusedId) ??
    journey.nodes.find((node) => node.point !== null) ??
    journey.nodes[0]
  const focusedNodeId = focused?.id ?? null

  useEffect(() => {
    stripRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [focusedNodeId])

  const nextLeg = journey.legs.find((leg) => leg.fromId === focused?.id)
  const time = focused ? formatStayTime(focused) : null

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      role="dialog"
      aria-modal="true"
      aria-label="ツーリングの地図"
    >
      <div className={styles.header}>
        <button
          ref={backButtonRef}
          type="button"
          className={styles.backButton}
          onClick={onClose}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          道のりへ戻る
        </button>
        {journey.routeUrl && (
          <a
            className={styles.link}
            href={journey.routeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Googleマップで経路を表示
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
      </div>

      <div className={styles.map}>
        <TouringRouteMap
          points={points}
          containerClassName={styles.mapContainer}
          focusedId={focusedNodeId}
          onPointClick={onFocus}
        />
      </div>

      <div ref={stripRef} className={styles.strip}>
        {journey.nodes.map((node) => {
          const isActive = node.id === focused?.id
          return (
            <button
              key={node.id}
              type="button"
              className={styles.stripButton}
              aria-label={`${node.name}を選ぶ`}
              aria-pressed={isActive}
              onClick={() => onFocus(node.id)}
            >
              <span
                className={`${styles.stripStone} ${isActive ? styles.stripStoneActive : ''} ${
                  node.kind === 'skip' || node.isPending
                    ? styles.stripStoneSkip
                    : ''
                }`}
                style={{ borderRadius: getStoneShape(node.id) }}
              >
                {node.mark}
              </span>
            </button>
          )
        })}
      </div>

      {focused && (
        <div className={styles.info}>
          <div className={styles.infoHeading}>
            <TouringStone node={focused} />
            <div className={styles.infoTitle}>
              <h2 className={styles.name}>{focused.name}</h2>
              {time && <p className={styles.time}>{time}</p>}
              {!focused.point && (
                <p className={styles.time}>位置情報は設定されていません</p>
              )}
            </div>
          </div>
          {focused.memo && <p className={styles.memo}>{focused.memo}</p>}
          <div className={styles.infoLinks}>
            {focused.point && (
              <a
                className={styles.link}
                href={`https://www.google.com/maps/search/?api=1&query=${focused.point.lat},${focused.point.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={13} aria-hidden="true" />
                Googleマップで開く
              </a>
            )}
            {nextLeg?.href && (
              <a
                className={styles.link}
                href={nextLeg.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                次の地点まで
                {nextLeg.minutes !== null &&
                  ` 移動 ${formatDuration(nextLeg.minutes)}`}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
