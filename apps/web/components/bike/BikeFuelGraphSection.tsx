'use client'

import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { FuelEfficiencyChart } from '@repo/ui/fuelEfficiencyChart'
import styles from './BikeFuelGraphSection.module.css'

type Props = {
  /** 日付昇順の給油履歴 */
  fuelLogs: ApiResponseFuelLogDetail[]
}

/**
 * 愛車のカルテ（PC）の方眼グラフ（Issue #575「05 画面案 ─ PC」愛車）
 *
 * @remarks
 * 既存の `FuelEfficiencyChart`（`packages/ui`、平均線は破線で実装済み）を
 * そのまま使い、`packages/ui` 自体は変更しない。枠付きパネルではなく
 * 方眼紙に線を引いた見た目にするため、直下の要素の枠・背景・角丸だけを
 * `BikeFuelGraphSection.module.css` で打ち消し、方眼の背景を重ねている。
 */
export function BikeFuelGraphSection({ fuelLogs }: Props) {
  const validCount = fuelLogs.filter(
    (log) => log.fuelEfficiency !== null
  ).length

  return (
    <section className={styles.section} data-testid="bike-fuel-graph-section">
      <h2 className={styles.title}>燃費の推移</h2>

      {validCount >= 2 ? (
        <div className={styles.gridPaper}>
          <FuelEfficiencyChart fuelLogs={fuelLogs} />
        </div>
      ) : (
        <p className={styles.empty}>
          グラフ表示には2回以上の給油履歴が必要です
        </p>
      )}
    </section>
  )
}
