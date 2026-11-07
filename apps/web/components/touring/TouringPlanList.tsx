'use client'

import type { ApiResponseTouringPlanListItem } from '@repo/shared-types'
import { DurationValue } from './TouringDetailHero'
import { TouringPebbles } from './TouringPebbles'
import styles from './TouringPlanList.module.css'
import { TouringPlanRouteStone } from './TouringRouteStone'
import { formatDuration } from '@/lib/utils/touringJourney'
import {
  formatPlanRoute,
  toPlanPebbleStops,
} from '@/lib/utils/touringPlanJourney'

type Props = {
  plans: ApiResponseTouringPlanListItem[]
  onSelect: (touringPlanId: string) => void
}

function TouringPlanRow({
  plan,
  onSelect,
}: {
  plan: ApiResponseTouringPlanListItem
  onSelect: (touringPlanId: string) => void
}) {
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.row}
        onClick={() => onSelect(plan.touringPlanId)}
      >
        <span className={styles.stoneSlot}>
          <TouringPlanRouteStone plan={plan} />
        </span>

        <span className={styles.body}>
          <span className={styles.titleLine}>
            <span className={styles.title}>{plan.title}</span>
            {plan.touringCount > 0 && (
              <span className={styles.ranTag}>
                走行記録 {plan.touringCount}件
              </span>
            )}
          </span>
          <span className={styles.route}>
            {plan.plannedMinutes !== null && (
              <span className={styles.durationInline}>
                {formatDuration(plan.plannedMinutes)} ・{' '}
              </span>
            )}
            {formatPlanRoute(plan)}
          </span>
          <TouringPebbles
            stops={toPlanPebbleStops(plan.stops)}
            status="PLANNED"
          />
        </span>

        <span className={styles.duration}>
          {plan.plannedMinutes !== null ? (
            <span className={styles.durationValue}>
              <DurationValue minutes={plan.plannedMinutes} />
            </span>
          ) : (
            <span className={styles.durationUnset}>所要時間 未定</span>
          )}
        </span>

        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  )
}

/**
 * ツーリングプランの一覧
 *
 * @remarks
 * `/app/my-bike/{id}/touring-plans` で、モバイルとPCの両方に使う。
 * プランに予定日はないので日付の列を持たず、経路の形と予定の長さで見分けられるようにする。
 * 走った順の並びではないため、走行記録の一覧と違って石を道でつながない。
 */
export function TouringPlanList({ plans, onSelect }: Props) {
  return (
    <ul className={styles.list} data-testid="touring-plan-list-section">
      {plans.map((plan) => (
        <TouringPlanRow
          key={plan.touringPlanId}
          plan={plan}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
