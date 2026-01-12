'use client'

import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { FuelLogItem } from './FuelLogItem'
import styles from './FuelLogListSection.module.css'

export interface FuelLogListSectionProps {
  /**
   * 表示する給油履歴のリスト（ソート済み）
   */
  fuelLogs: ApiResponseFuelLogDetail[]

  /**
   * 給油履歴編集時のコールバック
   */
  onEdit: (fuelLogId: string) => void

  /**
   * 給油履歴登録ボタンクリック時のコールバック
   */
  onRegister: () => void
}

export const FuelLogListSection = ({
  fuelLogs,
  onEdit,
  onRegister,
}: FuelLogListSectionProps) => {
  return (
    <BaseCard title="給油履歴">
      {fuelLogs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>給油履歴がまだありません</p>
          <Button onClick={onRegister} variant="primary">
            最初の給油履歴を登録
          </Button>
        </div>
      ) : (
        <div>
          {fuelLogs.map((fuelLog) => (
            <FuelLogItem
              key={fuelLog.fuelLogId}
              fuelLog={fuelLog}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </BaseCard>
  )
}
