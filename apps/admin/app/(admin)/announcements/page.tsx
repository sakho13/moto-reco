'use client'

import { CreateButton, DateField, List, useTable } from '@refinedev/antd'
import type { BaseRecord } from '@refinedev/core'
import { useCustomMutation, useInvalidate } from '@refinedev/core'
import { Button, Form, Space, Table, Tag } from 'antd'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default',
  PUBLISHED: 'green',
  EXPIRED: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '下書き',
  PUBLISHED: '公開中',
  EXPIRED: '失効済み',
}

export default function AnnouncementListPage() {
  const { tableProps, searchFormProps } = useTable<BaseRecord>({
    syncWithLocation: true,
    resource: 'announcements',
  })

  const { mutate } = useCustomMutation()
  const invalidate = useInvalidate()

  const refresh = () =>
    invalidate({ resource: 'announcements', invalidates: ['list'] })

  const handlePublish = (id: string) => {
    mutate(
      {
        url: `/api/admin/announcements/${id}/publish`,
        method: 'post',
        values: {},
      },
      { onSuccess: refresh }
    )
  }

  const handleExpire = (id: string) => {
    mutate(
      {
        url: `/api/admin/announcements/${id}/expire`,
        method: 'post',
        values: {},
      },
      { onSuccess: refresh }
    )
  }

  return (
    <List headerButtons={<CreateButton />}>
      <Form form={searchFormProps.form}>{null}</Form>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="status"
          title="ステータス"
          width={100}
          render={(v: string) => (
            <Tag color={STATUS_COLOR[v] ?? 'default'}>
              {STATUS_LABEL[v] ?? v}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="title"
          title="タイトル"
          render={(v: string, record: BaseRecord) => (
            <Link href={`/announcements/${record['id']}`}>{v}</Link>
          )}
        />
        <Table.Column dataIndex="type" title="種別" width={160} />
        <Table.Column
          dataIndex="readCount"
          title="既読数"
          width={80}
          align="right"
        />
        <Table.Column
          dataIndex="publishedAt"
          title="公開日"
          width={130}
          render={(v) =>
            v ? <DateField value={v} format="YYYY/MM/DD" /> : '-'
          }
        />
        <Table.Column
          dataIndex="createdAt"
          title="作成日"
          width={130}
          render={(v) => <DateField value={v} format="YYYY/MM/DD" />}
        />
        <Table.Column
          title="操作"
          width={160}
          render={(_: unknown, record: BaseRecord) => (
            <Space>
              {record['status'] === 'DRAFT' && (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handlePublish(record['id'] as string)}
                >
                  公開
                </Button>
              )}
              {record['status'] === 'PUBLISHED' && (
                <Button
                  size="small"
                  danger
                  onClick={() => handleExpire(record['id'] as string)}
                >
                  失効
                </Button>
              )}
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
