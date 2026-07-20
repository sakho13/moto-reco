'use client'

import type { ApiResponseTouringDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { TouringListItem } from './TouringListItem'
import styles from './TouringListSection.module.css'
import { KeywordSearchBar } from '@/components/common/KeywordSearchBar'

export interface TouringListSectionProps {
  tourings: ApiResponseTouringDetail[]
  onDetail?: (touringId: string) => void
  onRegister: () => void
  onSearch: (keyword: string) => void
  isSearchActive: boolean
}

export const TouringListSection = ({
  tourings,
  onDetail,
  onRegister,
  onSearch,
  isSearchActive,
}: TouringListSectionProps) => {
  return (
    <BaseCard title="ツーリング">
      <KeywordSearchBar
        placeholder="タイトルで検索"
        onSearch={onSearch}
        testId="touring-search"
      />
      {tourings.length === 0 ? (
        <div className={styles.emptyState}>
          {isSearchActive ? (
            <p>該当するツーリングが見つかりませんでした</p>
          ) : (
            <>
              <p>ツーリングの記録がまだありません</p>
              <Button onClick={onRegister} variant="primary">
                最初のツーリングを登録
              </Button>
            </>
          )}
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
