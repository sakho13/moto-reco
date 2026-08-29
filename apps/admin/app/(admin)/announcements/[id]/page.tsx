'use client'

import { DateField, Show } from '@refinedev/antd'
import { useCustomMutation, useInvalidate, useShow } from '@refinedev/core'
import { Button, Descriptions, Space, Table, Tag, Typography } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

type Reader = {
  userId: string
  name: string
  notificationEmail: string | null
  readAt: string
}

export default function AnnouncementShowPage() {
  const router = useRouter()
  const { query } = useShow({ resource: 'announcements' })
  const { data, isLoading } = query
  const record = data?.data

  const { mutate } = useCustomMutation()
  const invalidate = useInvalidate()

  const refresh = () => {
    invalidate({ resource: 'announcements', invalidates: ['detail'] })
    query.refetch()
  }

  const handlePublish = () => {
    mutate(
      {
        url: `/api/admin/announcements/${record?.id}/publish`,
        method: 'post',
        values: {},
      },
      { onSuccess: refresh }
    )
  }

  const handleExpire = () => {
    mutate(
      {
        url: `/api/admin/announcements/${record?.id}/expire`,
        method: 'post',
        values: {},
      },
      { onSuccess: refresh }
    )
  }

  const readers: Reader[] = (record?.readers ?? []) as Reader[]

  const headerButtons = (
    <Space>
      {record?.status === 'DRAFT' && (
        <Button type="primary" onClick={handlePublish}>
          公開
        </Button>
      )}
      {record?.status === 'PUBLISHED' && (
        <Button danger onClick={handleExpire}>
          失効
        </Button>
      )}
      <Button onClick={() => router.push('/announcements')}>一覧へ戻る</Button>
    </Space>
  )

  return (
    <Show isLoading={isLoading} headerButtons={headerButtons}>
      <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="ステータス">
          <Tag color={STATUS_COLOR[record?.status as string] ?? 'default'}>
            {STATUS_LABEL[record?.status as string] ?? record?.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="種別">
          {record?.type as string}
        </Descriptions.Item>
        {record?.version && (
          <Descriptions.Item label="バージョン">
            {record.version as string}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="タイトル">
          <Typography.Text strong>{record?.title as string}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="本文">
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {record?.body as string}
          </Typography.Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label="作成者">
          {record?.createdBy as string}
        </Descriptions.Item>
        <Descriptions.Item label="作成日時">
          {record?.createdAt ? (
            <DateField
              value={record.createdAt as string}
              format="YYYY/MM/DD HH:mm"
            />
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="公開日時">
          {record?.publishedAt ? (
            <DateField
              value={record.publishedAt as string}
              format="YYYY/MM/DD HH:mm"
            />
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="既読数">
          {record?.readCount as number} 人
        </Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5}>
        既読ユーザー一覧（{readers.length} 人）
      </Typography.Title>
      <Table<Reader>
        dataSource={readers}
        rowKey="userId"
        pagination={{ pageSize: 20 }}
        size="small"
      >
        <Table.Column
          title="名前"
          dataIndex="name"
          render={(v: string, record: Reader) => (
            <Link href={`/users/${record.userId}`}>{v}</Link>
          )}
        />
        <Table.Column
          title="通知メールアドレス"
          dataIndex="notificationEmail"
          render={(v: string | null) => v ?? '—'}
        />
        <Table.Column
          title="既読日時"
          dataIndex="readAt"
          render={(v: string) => (
            <DateField value={v} format="YYYY/MM/DD HH:mm" />
          )}
        />
      </Table>
    </Show>
  )
}
