'use client'

import { SearchOutlined } from '@ant-design/icons'
import {
  DateField,
  EditButton,
  List,
  ShowButton,
  useTable,
} from '@refinedev/antd'
import type { BaseRecord, CrudFilters } from '@refinedev/core'
import { Button, Form, Input, Select, Space, Table, Tag } from 'antd'
import Link from 'next/link'

const providerLabel: Record<string, string> = {
  FIREBASE_EMAIL: 'メール',
  FIREBASE_GOOGLE: 'Google',
  FIREBASE_ANONYMOUS: '匿名',
}

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

const roleOptions = [
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'USER', value: 'USER' },
  { label: 'GUEST', value: 'GUEST' },
]

type SearchForm = { q: string; role: string }

export default function UserListPage() {
  const { tableProps, searchFormProps } = useTable<
    BaseRecord,
    never,
    SearchForm
  >({
    syncWithLocation: true,
    resource: 'users',
    onSearch: ({ q, role }) => {
      const filters: CrudFilters = []
      if (q) filters.push({ field: 'q', operator: 'eq', value: q })
      if (role) filters.push({ field: 'role', operator: 'eq', value: role })
      return filters
    },
  })

  return (
    <List>
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="role">
          <Select
            options={roleOptions}
            placeholder="ロールで絞り込み"
            allowClear
            style={{ minWidth: 160 }}
          />
        </Form.Item>
        <Form.Item name="q">
          <Input placeholder="名前・メールで検索" allowClear />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" icon={<SearchOutlined />}>
            検索
          </Button>
        </Form.Item>
      </Form>
      <Table
        {...tableProps}
        rowKey="id"
        scroll={{ x: true }}
        rowClassName={(record: BaseRecord) =>
          record.role === 'ADMIN' ? 'ant-table-row-admin' : ''
        }
      >
        <Table.Column dataIndex="id" title="ID" width={180} ellipsis />
        <Table.Column
          dataIndex="name"
          title="名前"
          render={(v: string, record: BaseRecord) => (
            <Link href={`/users/${record.id as string}`}>{v}</Link>
          )}
        />
        <Table.Column
          dataIndex="notificationEmail"
          title="通知先メールアドレス"
        />
        <Table.Column
          dataIndex="authProviders"
          title="認証方式"
          render={(providers: { providerType: string }[]) =>
            providers?.map((p) => (
              <Tag key={p.providerType}>
                {providerLabel[p.providerType] ?? p.providerType}
              </Tag>
            ))
          }
        />
        <Table.Column
          dataIndex="role"
          title="ロール"
          render={(v: string) => (
            <Tag color={roleColor[v] ?? 'default'}>{v}</Tag>
          )}
          onCell={() => ({ style: { fontWeight: 600 } })}
        />
        <Table.Column
          dataIndex="status"
          title="ステータス"
          render={(v: string) => (
            <Tag color={statusColor[v] ?? 'default'}>{v}</Tag>
          )}
        />
        <Table.Column
          dataIndex="createdAt"
          title="登録日"
          render={(v) => <DateField value={v} format="YYYY/MM/DD" />}
        />
        <Table.Column
          title="操作"
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="middle" recordItemId={record.id} />
              <EditButton hideText size="middle" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
