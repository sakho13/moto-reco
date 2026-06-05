'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { TouringListItem } from './TouringListItem'
import styles from './TouringListSection.module.css'

export interface TouringListSectionProps {
  tourings: ApiResponseTouringDetail[]
  onDetail?: (touringId: string) => void
  onRegister: () => void
}

export const TouringListSection = ({
  tourings,
  onDetail,
  onRegister,
}: TouringListSectionProps) => {
  return (
    <BaseCard title="ツーリング">
      {tourings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>ツーリングの記録がまだありません</p>
          <Button onClick={onRegister} variant="primary">
            最初のツーリングを登録
          </Button>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {tourings.map((touring) => (
            <TouringListItem
              key={touring.touringId}
              touring={touring}
              onDetail={onDetail}
            />
          ))}
        </div>
      )}
    </BaseCard>
  )
}
