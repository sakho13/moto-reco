'use client'

import { getCurrentDate } from '@repo/shared-utils'
import { buildMonthlySummary } from './monthlySummary'
import styles from './TodaySheetHead.module.css'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useBikeHistory } from '@/lib/hooks/useBikeHistory'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

function formatTodayLabel(now: Date): string {
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${WEEKDAYS[now.getDay()]}）`
}

/**
 * ホーム「今日」見開き（PC）の見出し罫
 *
 * @remarks
 * Issue #575「05 画面案 ─ PC」。「今日 {日付}」と当月サマリ（給油回数・給油量・
 * 燃料費）を1行に置き、下に太い罫線を引く。KPIカードにはしない。
 * 当月の走行距離は、月初直前の給油〜現在を一定ペースとみなした推定値を
 * 実測のように見せてしまうため表示しない（Issue #575 ユーザー判断）。
 * `buildMonthlySummary` が返すのは給油回数・給油量・燃料費という実測値のみ。
 * モバイルでは表示しない（PC専用）。
 */
export function TodaySheetHead() {
  const { activeBike } = useActiveBike()
  const bikeId = activeBike?.myUserBikeId ?? null
  const { data: history } = useBikeHistory(bikeId)

  const now = getCurrentDate()
  const summary = buildMonthlySummary(history ?? [], now)

  return (
    <div className={styles.head}>
      <h2 className={styles.title}>
        今日 <span className={styles.date}>{formatTodayLabel(now)}</span>
      </h2>
      <p className={styles.summary}>
        給油{summary.fuelLogCount}回 ／ {summary.totalFuelAmount.toFixed(1)}L ／{' '}
        {summary.totalFuelCost.toLocaleString()}円
      </p>
    </div>
  )
}
