'use client'

import type { ApiResponseTouringPlanListItem } from '@repo/shared-types'
import { formatDateTime } from '@repo/shared-utils'
import styles from './PlanCard.module.css'

export interface PlanCardProps {
  plan: ApiResponseTouringPlanListItem
  onClick?: (touringPlanId: string) => void
}

/**
 * ツーリングプラン一覧の各アイテムを表示するカード
 *
 * @remarks
 * タイトル・更新日時・目的地名を表示する。
 * `onClick` が指定されている場合はクリック可能なカードとして表示する。
 */
export const PlanCard = ({ plan, onClick }: PlanCardProps) => {
  return (
    <div
      className={`${styles.item} ${onClick ? styles.itemClickable : ''}`}
      onClick={() => onClick?.(plan.touringPlanId)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(plan.touringPlanId)
              }
            }
          : undefined
      }
    >
      <div className={styles.mainRow}>
        <h3 className={styles.title}>{plan.title}</h3>
        <span className={styles.chevron}>›</span>
      </div>

      <div className={styles.periodRow}>
        <span>更新: {formatDateTime(plan.updatedAt)}</span>
      </div>

      {plan.destination?.name && (
        <div className={styles.detailsRow}>
          <span>目的地: {plan.destination.name}</span>
        </div>
      )}
    </div>
  )
}
