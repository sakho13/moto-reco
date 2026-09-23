'use client'

import styles from './HomeOdometer.module.css'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useBikeHistory } from '@/lib/hooks/useBikeHistory'

const DASH = '—'

/**
 * 総走行距離を1桁ずつのカンマ区切り文字配列に分解する
 *
 * @remarks
 * `en-US` ロケールを明示することで、実行環境のロケール設定に依存せず
 * 常にカンマ区切り（`13,010`）になるようにする。
 */
function splitOdometerDigits(value: number): string[] {
  const safeValue = Math.max(0, Math.trunc(value))
  return safeValue.toLocaleString('en-US').split('')
}

/**
 * ホーム「今日」見開き（PC）のオドメーター
 *
 * @remarks
 * Issue #575「05 画面案 ─ PC」。総走行距離を1桁ずつプレートに組んだ計器表現にする。
 * KPIカードにはせず、各桁を `--color-ink` の地に `--color-background`
 * （紙面相当）の文字で表す。モバイルでは表示しない（PC専用）。
 */
export function HomeOdometer() {
  const { activeBike } = useActiveBike()
  const bikeId = activeBike?.myUserBikeId ?? null
  const { data: history } = useBikeHistory(bikeId)

  if (!activeBike) return null

  const fuelLogs = (history ?? []).flatMap((item) =>
    item.type === 'FUEL_LOG' ? [item.fuelLog] : []
  )
  const lastFuelLogMileage = fuelLogs[0]?.mileage ?? null
  // 給油登録直後は「総走行距離（アクティブ車両一覧）」のSWRキャッシュが
  // まだ更新前で、一時的に給油時ODOより小さい値を指すことがある。
  // 負値はそのまま出すと意味を持たないため「—」に倒す。
  const rawSinceLastFuel =
    lastFuelLogMileage !== null
      ? activeBike.totalMileage - lastFuelLogMileage
      : null
  const sinceLastFuel =
    rawSinceLastFuel !== null && rawSinceLastFuel >= 0 ? rawSinceLastFuel : null

  const digits = splitOdometerDigits(activeBike.totalMileage)

  return (
    <div className={styles.odo}>
      <span className={styles.label}>ODO</span>
      <span className={styles.digits}>
        {digits.map((char, index) =>
          char === ',' ? (
            <span key={index} className={styles.sep}>
              ,
            </span>
          ) : (
            <span key={index} className={styles.plate}>
              {char}
            </span>
          )
        )}
      </span>
      <span className={styles.unit}>km</span>
      <span className={styles.since}>
        {sinceLastFuel === null
          ? `前回の給油から ${DASH}`
          : `前回の給油から ${sinceLastFuel.toLocaleString()} km`}
      </span>
    </div>
  )
}
