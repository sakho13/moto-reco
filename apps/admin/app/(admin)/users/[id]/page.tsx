'use client'

import { DateField, Show } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Descriptions, Table, Tag, Typography } from 'antd'
import Link from 'next/link'

const statusColor: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
  SUSPENDED: 'red',
}

const roleColor: Record<string, string> = {
  ADMIN: 'gold',
  USER: 'blue',
  GUEST: 'default',
}

const ownStatusColor: Record<string, string> = {
  OWN: 'green',
  SOLD: 'default',
}

const providerLabel: Record<string, string> = {
  FIREBASE_EMAIL: 'メール',
  FIREBASE_GOOGLE: 'Google',
  FIREBASE_ANONYMOUS: '匿名',
}

type AuthProvider = {
  providerType: string
  externalId: string
  isActive: boolean
}

type MyBike = {
  id: string
  nickname: string | null
  ownStatus: string
  ownedAt: string | null
  soldAt: string | null
  userBike: {
    totalMileage: number | null
    bike: {
      modelName: string
      modelYear: number | null
      manufacturer: { id: string; name: string }
    } | null
  }
}

export default function UserShowPage() {
  const { query } = useShow()
  const { data, isLoading } = query
  const record = data?.data

  const authProviders: AuthProvider[] = (record?.authProviders ??
    []) as AuthProvider[]
  const myBikes: MyBike[] = (record?.myBikes ?? []) as MyBike[]

  return (
    <Show isLoading={isLoading}>
      <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="ID">{record?.id as string}</Descriptions.Item>
        <Descriptions.Item label="名前">
          {record?.name as string}
        </Descriptions.Item>
        <Descriptions.Item label="通知メール">
          {(record?.notificationEmail as string) ?? '未設定'}
        </Descriptions.Item>
        <Descriptions.Item label="ステータス">
          <Tag color={statusColor[record?.status as string] ?? 'default'}>
            {record?.status as string}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="ロール">
          <Tag color={roleColor[record?.role as string] ?? 'default'}>
            {record?.role as string}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="プロフィール公開">
          {record?.isProfilePublic ? '公開' : '非公開'}
        </Descriptions.Item>
        <Descriptions.Item label="登録日">
          {record?.createdAt ? (
            <DateField
              value={record.createdAt as string}
              format="YYYY/MM/DD HH:mm"
            />
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="更新日">
          {record?.updatedAt ? (
            <DateField
              value={record.updatedAt as string}
              format="YYYY/MM/DD HH:mm"
            />
          ) : (
            '—'
          )}
        </Descriptions.Item>
      </Descriptions>

      <Typography.Title level={4} style={{ marginTop: 32 }}>
        認証プロバイダー
      </Typography.Title>
      <Table<AuthProvider>
        dataSource={authProviders}
        rowKey="externalId"
        pagination={false}
        style={{ marginBottom: 32 }}
      >
        <Table.Column
          title="プロバイダー"
          dataIndex="providerType"
          render={(v: string) => <Tag>{providerLabel[v] ?? v}</Tag>}
        />
        <Table.Column title="外部ID" dataIndex="externalId" />
        <Table.Column
          title="有効"
          dataIndex="isActive"
          render={(v: boolean) => (
            <Tag color={v ? 'green' : 'default'}>{v ? '有効' : '無効'}</Tag>
          )}
        />
      </Table>

      <Typography.Title level={4}>所有バイク一覧</Typography.Title>
      <Table<MyBike>
        dataSource={myBikes}
        rowKey="id"
        pagination={false}
        scroll={{ x: true }}
      >
        <Table.Column
          title="ニックネーム"
          render={(_: unknown, row: MyBike) => (
            <Link href={`/my-bikes/${row.id}`}>{row.nickname ?? '—'}</Link>
          )}
        />
        <Table.Column
          title="メーカー"
          render={(_: unknown, row: MyBike) =>
            row.userBike.bike?.manufacturer.name ?? '—'
          }
        />
        <Table.Column
          title="モデル名"
          render={(_: unknown, row: MyBike) =>
            row.userBike.bike?.modelName ?? '—'
          }
        />
        <Table.Column
          title="年式"
          render={(_: unknown, row: MyBike) =>
            row.userBike.bike?.modelYear ?? '—'
          }
        />
        <Table.Column
          title="総走行距離 (km)"
          render={(_: unknown, row: MyBike) =>
            row.userBike.totalMileage != null
              ? row.userBike.totalMileage.toLocaleString()
              : '—'
          }
        />
        <Table.Column
          title="ステータス"
          dataIndex="ownStatus"
          render={(v: string) => (
            <Tag color={ownStatusColor[v] ?? 'default'}>{v}</Tag>
          )}
        />
        <Table.Column
          title="所有開始日"
          dataIndex="ownedAt"
          render={(v: string | null) =>
            v ? <DateField value={v} format="YYYY/MM/DD" /> : '—'
          }
        />
        <Table.Column
          title="売却日"
          dataIndex="soldAt"
          render={(v: string | null) =>
            v ? <DateField value={v} format="YYYY/MM/DD" /> : '—'
          }
        />
      </Table>
    </Show>
  )
}
