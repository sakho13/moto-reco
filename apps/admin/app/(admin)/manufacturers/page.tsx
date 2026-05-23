'use client'

import { SearchOutlined } from '@ant-design/icons'
import {
  CreateButton,
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from '@refinedev/antd'
import type { BaseRecord, CrudFilters } from '@refinedev/core'
import { Button, Form, Input, Space, Table, Tag } from 'antd'

type SearchForm = { q: string }

export default function ManufacturerListPage() {
  const { tableProps, searchFormProps } = useTable<
    BaseRecord,
    never,
    SearchForm
  >({
    syncWithLocation: true,
    resource: 'manufacturers',
    onSearch: ({ q }) => {
      const filters: CrudFilters = []
      if (q) filters.push({ field: 'q', operator: 'eq', value: q })
      return filters
    },
  })

  return (
    <List headerButtons={<CreateButton />}>
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="q">
          <Input placeholder="メーカー名・英語名で検索" allowClear />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" icon={<SearchOutlined />}>
            検索
          </Button>
        </Form.Item>
      </Form>
      <Table {...tableProps} rowKey="id" scroll={{ x: true }}>
        <Table.Column dataIndex="name" title="メーカー名" />
        <Table.Column dataIndex="nameEn" title="英語名" />
        <Table.Column dataIndex="country" title="国" />
        <Table.Column
          dataIndex="isActive"
          title="有効"
          render={(v: boolean) => (
            <Tag color={v ? 'green' : 'default'}>{v ? '有効' : '無効'}</Tag>
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
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
