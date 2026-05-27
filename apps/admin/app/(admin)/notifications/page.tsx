'use client'

import { DateField, useTable } from '@refinedev/antd'
import type { BaseRecord } from '@refinedev/core'
import { Form, Table, Tag } from 'antd'
import Link from 'next/link'

const TYPE_LABEL: Record<string, string> = {
  FOLLOWED: 'フォロー',
}

const TYPE_COLOR: Record<string, string> = {
  FOLLOWED: 'blue',
}

type NotificationRow = BaseRecord & {
  userId: string
  userName: string
  notificationEmail: string | null
  type: string
  title: string
  isRead: boolean
  createdAt: string
}

export default function NotificationListPage() {
  const { tableProps, searchFormProps } = useTable<NotificationRow>({
    syncWithLocation: true,
    resource: 'notifications',
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  })

  return (
    <>
      <Form form={searchFormProps.form}>{null}</Form>
      <Table<NotificationRow> {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="userName"
          title="受信者"
          render={(v: string, record: NotificationRow) => (
            <Link href={`/users/${record.userId}`}>{v}</Link>
          )}
        />
        <Table.Column
          dataIndex="notificationEmail"
          title="通知メール"
          render={(v: string | null) => v ?? '—'}
        />
        <Table.Column
          dataIndex="type"
          title="種別"
          width={120}
          render={(v: string) => (
            <Tag color={TYPE_COLOR[v] ?? 'default'}>{TYPE_LABEL[v] ?? v}</Tag>
          )}
        />
        <Table.Column
          dataIndex="title"
          title="タイトル"
          render={(v: string, record: NotificationRow) => (
            <Link href={`/notifications/${record.id}`}>{v}</Link>
          )}
        />
        <Table.Column
          dataIndex="isRead"
          title="既読"
          width={80}
          align="center"
          render={(v: boolean) =>
            v ? <Tag color="green">既読</Tag> : <Tag color="default">未読</Tag>
          }
        />
        <Table.Column
          dataIndex="createdAt"
          title="送信日時"
          width={150}
          render={(v: string) => (
            <DateField value={v} format="YYYY/MM/DD HH:mm" />
          )}
        />
      </Table>
    </>
  )
}
