'use client'

import type { FuelLogPeriod } from '@repo/shared-types'
import { Select } from '@repo/ui/select'
import type { SelectOption } from '@repo/ui/select'
import styles from './BikeCarteControls.module.css'

const PERIOD_OPTIONS: SelectOption[] = [
  { value: 'latest-year', label: '最新の履歴から1年' },
  { value: 'latest-month', label: '最新の履歴から1ヶ月' },
  { value: 'past-year', label: '現在日時から直近1年' },
  { value: 'past-month', label: '現在日時から直近1ヶ月' },
]

type Props = {
  period: FuelLogPeriod
  onPeriodChange: (period: FuelLogPeriod) => void
  fullTankOnly: boolean
  onFullTankOnlyChange: (value: boolean) => void
}

/**
 * 愛車のカルテ（PC）の期間・満タンフィルタ（Issue #575「05 画面案 ─ PC」愛車）
 *
 * @remarks
 * 添え数値・方眼グラフ・給油の台帳（抜粋）の3つが共有する期間フィルタ。
 * PCのみで表示し（`page.module.css` の `.desktopOnly` でモバイルは非表示）、
 * 新しいAPIは追加せず、既存の給油履歴一覧APIの `period` パラメータをそのまま使う。
 */
export function BikeCarteControls({
  period,
  onPeriodChange,
  fullTankOnly,
  onFullTankOnlyChange,
}: Props) {
  return (
    <div className={styles.bar} data-testid="bike-carte-controls">
      <Select
        id="bike-carte-period"
        aria-label="期間"
        className={styles.periodSelect}
        options={PERIOD_OPTIONS}
        value={period}
        onChange={(event) =>
          onPeriodChange(event.target.value as FuelLogPeriod)
        }
      />
      <button
        type="button"
        className={
          fullTankOnly ? `${styles.chip} ${styles.chipActive}` : styles.chip
        }
        aria-pressed={fullTankOnly}
        onClick={() => onFullTankOnlyChange(!fullTankOnly)}
      >
        満タンのみ
      </button>
    </div>
  )
}
