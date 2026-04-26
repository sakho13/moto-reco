'use client'

import type { ApiResponseMaintenanceLogDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { MaintenanceLogItem } from './MaintenanceLogItem'
import styles from './MaintenanceLogListSection.module.css'

type MaintenanceLogListSectionProps = {
  logs: ApiResponseMaintenanceLogDetail[]
  onEdit: (maintenanceLogId: string) => void
  onRegister: () => void
  onLoadMore?: () => void
  canLoadMore?: boolean
  isLoadingMore?: boolean
}

export const MaintenanceLogListSection = ({
  logs,
  onEdit,
  onRegister,
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
}: MaintenanceLogListSectionProps) => {
  return (
    <BaseCard title="メンテナンス履歴">
      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>メンテナンス履歴がまだありません</p>
          <Button onClick={onRegister} variant="primary">
            最初のメンテナンスを登録
          </Button>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {logs.map((log) => (
            <MaintenanceLogItem
              key={log.maintenanceLogId}
              log={log}
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
