'use client'

import { ChevronLeft, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './TouringDetailHero.module.css'
import { TouringRouteShape } from './TouringRouteShape'
import { TouringStatusMark } from './TouringStatusMark'
import { calcTravelMinutes } from '@/lib/utils/googleMaps'
import type { Journey } from '@/lib/utils/touringJourney'
import { formatTouringDate } from '@/lib/utils/touringJourney'

type Props = {
  touring: ApiResponseTouringDetail
  journey: Journey
  now: Date
  backHref: string
  planHref: string | null
  onEdit: () => void
  /** 地図を別画面で開くとき。地図を並べて表示している場合は未指定 */
  onOpenMap?: () => void
  /** 編集ボタンの隣に出す操作 */
  headerActions?: ReactNode
  /** 数値の下に出す操作 */
  children?: ReactNode
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statValue}>{children}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}

function DurationValue({ minutes }: { minutes: number }) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return (
    <>
      {hours > 0 && (
        <>
          {hours}
          <small className={styles.statUnit}>時間</small>
        </>
      )}
      {(hours === 0 || rest > 0) && (
        <>
          {rest}
          <small className={styles.statUnit}>分</small>
        </>
      )}
    </>
  )
}

/** ツーリング詳細の見出し。経路の形と、その日の数字を見せる */
export function TouringDetailHero({
  touring,
  journey,
  now,
  backHref,
  planHref,
  onEdit,
  onOpenMap,
  headerActions,
  children,
}: Props) {
  const isStarted = touring.status === 'STARTED'
  const elapsedMinutes = calcTravelMinutes(
    touring.startDate,
    isStarted ? now.toISOString() : touring.endDate
  )

  return (
    <header className={styles.hero}>
      <div className={styles.navRow}>
        <Link href={backHref} className={styles.backLink}>
          <ChevronLeft size={16} aria-hidden="true" />
          一覧へ
        </Link>
        <div className={styles.actions}>
          {headerActions}
          <Button type="button" variant="cloud" onClick={onEdit}>
            編集する
          </Button>
        </div>
      </div>

      <div className={styles.titleRow}>
        <div className={styles.titleBlock}>
          <p className={styles.date}>{formatTouringDate(touring)}</p>
          <h1 className={styles.title}>{touring.title}</h1>
          <div className={styles.statusRow}>
            <TouringStatusMark status={touring.status} />
            {planHref && (
              <Link href={planHref} className={styles.planLink}>
                元プランから開始されました →
              </Link>
            )}
          </div>
        </div>

        {onOpenMap && (
          <button
            type="button"
            className={styles.mapOpener}
            onClick={onOpenMap}
          >
            <TouringRouteShape
              className={styles.routeShape}
              points={journey.routePoints}
              width={117}
              height={130}
            />
            <span className={styles.mapOpenerLabel}>
              <MapPin size={13} aria-hidden="true" />
              地図を開く
            </span>
          </button>
        )}
      </div>

      <div className={styles.stats}>
        {journey.distance !== null && (
          <Stat label="走った距離">
            {journey.distance.toLocaleString()}
            <small className={styles.statUnit}>km</small>
          </Stat>
        )}
        {elapsedMinutes !== null && (
          <Stat label={isStarted ? '経過' : '出発から到着まで'}>
            <DurationValue minutes={elapsedMinutes} />
          </Stat>
        )}
        <Stat label="寄り道">
          {journey.spotCount}
          <small className={styles.statUnit}>か所</small>
        </Stat>
        {isStarted && (
          <Stat label="休憩">
            {journey.breakCount}
            <small className={styles.statUnit}>回</small>
          </Stat>
        )}
      </div>

      {children}
    </header>
  )
}
