'use client'

import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { FuelLogItem } from './FuelLogItem'
import styles from './FuelLogListSection.module.css'
import { KeywordSearchBar } from '@/components/common/KeywordSearchBar'

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

  /**
   * さらに給油履歴を読み込むボタンクリック時のコールバック
   */
  onLoadMore?: () => void

  /**
   * 追加読み込みが可能かどうか
   */
  canLoadMore?: boolean

  /**
   * 追加読み込み中かどうか
   */
  isLoadingMore?: boolean

  /**
   * キーワード検索確定時のコールバック
   */
  onSearch: (keyword: string) => void

  /**
   * キーワード検索が適用中かどうか
   */
  isSearchActive: boolean
}

export const FuelLogListSection = ({
  fuelLogs,
  onEdit,
  onRegister,
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
  onSearch,
  isSearchActive,
}: FuelLogListSectionProps) => {
  return (
    <BaseCard title="給油履歴">
      <KeywordSearchBar
        placeholder="メモ・ツーリング名で検索"
        onSearch={onSearch}
        testId="fuel-log-search"
      />
      {fuelLogs.length === 0 ? (
        <div className={styles.emptyState}>
          {isSearchActive ? (
            <p>該当する給油履歴が見つかりませんでした</p>
          ) : (
            <>
              <p>給油履歴がまだありません</p>
              <Button onClick={onRegister} variant="primary">
                最初の給油履歴を登録
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.listContainer}>
          {fuelLogs.map((fuelLog) => (
            <FuelLogItem
              key={fuelLog.fuelLogId}
              fuelLog={fuelLog}
              onEdit={onEdit}
            />
          ))}
          {canLoadMore && onLoadMore && (
            <div className={styles.loadMore}>
              <Button
                onClick={onLoadMore}
                variant="cloud"
                loading={isLoadingMore}
              >
                もっと見る
              </Button>
            </div>
          )}
        </div>
      )}
    </BaseCard>
  )
}
