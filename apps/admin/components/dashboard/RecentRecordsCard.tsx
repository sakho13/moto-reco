'use client'

import { type BaseRecord, useList } from '@refinedev/core'
import { Card, Table, type TableColumnsType } from 'antd'
import Link from 'next/link'

const RECENT_RECORDS_COUNT = 5

type RecentRecordsCardProps<T extends BaseRecord> = {
  title: string
  resource: string
  listPath: string
  columns: TableColumnsType<T>
}

/** 指定したリソースを登録日時の新しい順に数件表示するカード */
export function RecentRecordsCard<T extends BaseRecord>({
  title,
  resource,
  listPath,
  columns,
}: RecentRecordsCardProps<T>) {
  const { result, query } = useList<T>({
    resource,
    pagination: { currentPage: 1, pageSize: RECENT_RECORDS_COUNT },
    sorters: [{ field: 'createdAt', order: 'desc' }],
  })

  return (
    <Card
      title={title}
      extra={<Link href={listPath}>すべて見る</Link>}
      styles={{ body: { padding: 0 } }}
    >
      <Table<T>
        dataSource={result.data}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        loading={query.isLoading}
        scroll={{ x: true }}
        locale={{ emptyText: 'まだ登録がありません' }}
      />
    </Card>
  )
}
