'use client'

import { ChevronLeft, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ApiResponseTouringPlanDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { DurationValue, Stat } from './TouringDetailHero'
import styles from './TouringDetailHero.module.css'
import { TouringRouteShape } from './TouringRouteShape'
import type { PlanJourney } from '@/lib/utils/touringPlanJourney'

type Props = {
  plan: ApiResponseTouringPlanDetail
  journey: PlanJourney
  backHref: string
  /** 地点の取得が済んでいるか。済むまで数値を出さない */
  hasLoadedStops: boolean
  /** 走行記録の見出しまで移動するとき */
  onShowHistory: () => void
  onEdit: () => void
  /** 地図を別画面で開くとき。地図を並べて表示している場合は未指定 */
  onOpenMap?: () => void
  /** 数値の下に出す操作 */
  children?: ReactNode
}

/** ツーリングプランの見出し。経路の形と、予定の長さを見せる */
export function TouringPlanHero({
  plan,
  journey,
  backHref,
  hasLoadedStops,
  onShowHistory,
  onEdit,
  onOpenMap,
  children,
}: Props) {
  const touringCount = plan.touringIds.length

  return (
    <header className={styles.hero}>
      <div className={styles.navRow}>
        <Link href={backHref} className={styles.backLink}>
          <ChevronLeft size={16} aria-hidden="true" />
          一覧へ
        </Link>
        <div className={styles.actions}>
          <Button type="button" variant="cloud" onClick={onEdit}>
            プランを編集
          </Button>
        </div>
      </div>

      <div className={styles.titleRow}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{plan.title}</h1>
          {touringCount > 0 && (
            <div className={styles.statusRow}>
              <button
                type="button"
                className={`${styles.planLink} ${styles.planLinkButton}`}
                onClick={onShowHistory}
              >
                このプランの走行記録 {touringCount}件 →
              </button>
            </div>
          )}
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

      {hasLoadedStops && !journey.isBlank && (
        <div className={styles.stats}>
          <Stat
            label={
              journey.hasDestination ? '出発から到着まで' : '最後の地点まで'
            }
          >
            {journey.plannedMinutes !== null ? (
              <DurationValue minutes={journey.plannedMinutes} />
            ) : (
              '未定'
            )}
          </Stat>
          <Stat label="寄り道">
            {journey.spotCount}
            <small className={styles.statUnit}>か所</small>
          </Stat>
          <Stat label="休憩">
            {journey.breakCount}
            <small className={styles.statUnit}>回</small>
          </Stat>
        </div>
      )}

      {children}
    </header>
  )
}
