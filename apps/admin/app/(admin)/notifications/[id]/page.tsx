'use client'

import { DateField, Show } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Descriptions, Tag, Typography } from 'antd'
import { Button } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TYPE_LABEL: Record<string, string> = {
  FOLLOWED: 'フォロー',
}

const TYPE_COLOR: Record<string, string> = {
  FOLLOWED: 'blue',
}

export default function NotificationShowPage() {
  const router = useRouter()
  const { query } = useShow({ resource: 'notifications' })
  const { data, isLoading } = query
  const record = data?.data

  return (
    <Show
      isLoading={isLoading}
      headerButtons={
        <Button onClick={() => router.push('/notifications')}>
          一覧へ戻る
        </Button>
      }
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="受信者">
          {record?.userId ? (
            <Link href={`/users/${record.userId as string}`}>
              {record.userName as string}
            </Link>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="通知メール">
          {(record?.notificationEmail as string | null) ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="種別">
          <Tag color={TYPE_COLOR[record?.type as string] ?? 'default'}>
            {TYPE_LABEL[record?.type as string] ?? (record?.type as string)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="タイトル">
          <Typography.Text strong>{record?.title as string}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="本文">
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {record?.body as string}
          </Typography.Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label="既読">
          {record?.isRead ? (
            <Tag color="green">既読</Tag>
          ) : (
            <Tag color="default">未読</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="既読日時">
          {record?.readAt ? (
            <DateField
              value={record.readAt as string}
              format="YYYY/MM/DD HH:mm"
            />
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="送信日時">
          {record?.createdAt ? (
            <DateField
              value={record.createdAt as string}
              format="YYYY/MM/DD HH:mm"
            />
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="メタデータ">
          {record?.metadata ? (
            <pre
              style={{
                margin: 0,
                padding: '8px 12px',
                background: '#f5f5f5',
                borderRadius: 4,
                fontSize: 12,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(record.metadata, null, 2)}
            </pre>
          ) : (
            '—'
          )}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  )
}
