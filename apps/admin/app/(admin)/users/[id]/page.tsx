'use client'

import { DateField, Show, TextField } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Table, Tag, Typography } from 'antd'
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
      <Typography.Title level={5}>ID</Typography.Title>
      <TextField value={record?.id} />

      <Typography.Title level={5}>名前</Typography.Title>
      <TextField value={record?.name} />

      <Typography.Title level={5}>通知メール</Typography.Title>
      <TextField value={record?.notificationEmail ?? '未設定'} />

      <Typography.Title level={5}>ステータス</Typography.Title>
      <Tag color={statusColor[record?.status] ?? 'default'}>
        {record?.status}
      </Tag>

      <Typography.Title level={5}>ロール</Typography.Title>
      <Tag color={roleColor[record?.role] ?? 'default'}>{record?.role}</Tag>

      <Typography.Title level={5}>プロフィール公開</Typography.Title>
      <TextField value={record?.isProfilePublic ? '公開' : '非公開'} />

      <Typography.Title level={5}>登録日</Typography.Title>
      <DateField value={record?.createdAt} format="YYYY/MM/DD HH:mm" />

      <Typography.Title level={5}>更新日</Typography.Title>
      <DateField value={record?.updatedAt} format="YYYY/MM/DD HH:mm" />

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
