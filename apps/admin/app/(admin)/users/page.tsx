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
import { Button, Form, Input, Space, Table, Tag } from 'antd'

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

type SearchForm = { q: string }

export default function UserListPage() {
  const { tableProps, searchFormProps } = useTable<
    BaseRecord,
    never,
    SearchForm
  >({
    syncWithLocation: true,
    resource: 'users',
    onSearch: ({ q }) => {
      const filters: CrudFilters = []
      if (q) filters.push({ field: 'q', operator: 'eq', value: q })
      return filters
    },
  })

  return (
    <List>
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="q">
          <Input placeholder="名前・メールで検索" allowClear />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" icon={<SearchOutlined />}>
            検索
          </Button>
        </Form.Item>
      </Form>
      <Table {...tableProps} rowKey="id" scroll={{ x: true }}>
        <Table.Column dataIndex="id" title="ID" width={180} ellipsis />
        <Table.Column dataIndex="name" title="名前" />
        <Table.Column dataIndex="notificationEmail" title="メール" />
        <Table.Column
          dataIndex="status"
          title="ステータス"
          render={(v: string) => (
            <Tag color={statusColor[v] ?? 'default'}>{v}</Tag>
          )}
        />
        <Table.Column
          dataIndex="role"
          title="ロール"
          render={(v: string) => (
            <Tag color={roleColor[v] ?? 'default'}>{v}</Tag>
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
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
