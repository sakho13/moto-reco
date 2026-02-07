'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { TouringListItem } from './TouringListItem'
import styles from './TouringListSection.module.css'

export interface TouringListSectionProps {
  /**
   * 表示するツーリング記録のリスト（ソート済み）
   */
  tourings: ApiResponseTouringDetail[]

  /**
   * ツーリング記録編集時のコールバック
   */
  onEdit: (touringId: string) => void

  /**
   * ツーリング記録登録ボタンクリック時のコールバック
   */
  onRegister: () => void
}

export const TouringListSection = ({
  tourings,
  onEdit,
  onRegister,
}: TouringListSectionProps) => {
  return (
    <BaseCard
      title="ツーリング記録"
      headerAction={
        <Button onClick={onRegister} variant="cloud" size="md">
          登録
        </Button>
      }
    >
      {tourings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>ツーリング記録がまだありません</p>
          <Button onClick={onRegister} variant="primary">
            最初のツーリング記録を登録
          </Button>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {tourings.map((touring) => (
            <TouringListItem
              key={touring.touringId}
              touring={touring}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </BaseCard>
  )
}
