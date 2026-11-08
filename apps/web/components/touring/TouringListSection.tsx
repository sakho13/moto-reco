'use client'

import type { ApiResponseTouringListItem } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { TouringListItem } from './TouringListItem'
import styles from './TouringListSection.module.css'
import {
  formatTouringSummary,
  sumTouringDistance,
  TouringMonthHeading,
} from './TouringMonthHeading'
import { KeywordSearchBar } from '@/components/common/KeywordSearchBar'
import { groupTouringsByMonth } from '@/lib/utils/touringJourney'

export interface TouringListSectionProps {
  tourings: ApiResponseTouringListItem[]
  onDetail: (touringId: string) => void
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
  const groups = groupTouringsByMonth(tourings)

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>ツーリング</h2>
        {tourings.length > 0 && (
          <p className={styles.summary}>
            {formatTouringSummary(
              tourings.length,
              '件',
              sumTouringDistance(tourings)
            )}
          </p>
        )}
      </div>

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
        <div className={styles.groups}>
          {groups.map((group) => (
            <div key={group.key}>
              <TouringMonthHeading
                label={group.label}
                count={group.items.length}
                totalDistance={group.totalDistance}
              />
              <ul className={styles.list}>
                {group.items.map((touring) => (
                  <TouringListItem
                    key={touring.touringId}
                    touring={touring}
                    onDetail={onDetail}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
