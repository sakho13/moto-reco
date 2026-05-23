'use client'

import {
  CreateButton,
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useSelect,
  useTable,
} from '@refinedev/antd'
import { Button, Form, Input, Select, Space, Table, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import Link from 'next/link'
import type { BaseRecord, CrudFilters } from '@refinedev/core'

type SearchForm = { q: string; manufacturerId: string }

export default function BikeListPage() {
  const { tableProps, searchFormProps } = useTable<BaseRecord, never, SearchForm>({
    syncWithLocation: true,
    resource: 'bikes',
    onSearch: ({ q, manufacturerId }) => {
      const filters: CrudFilters = []
      if (q) filters.push({ field: 'q', operator: 'eq', value: q })
      if (manufacturerId) filters.push({ field: 'manufacturerId', operator: 'eq', value: manufacturerId })
      return filters
    },
  })

  const { selectProps: manufacturerSelectProps } = useSelect({
    resource: 'manufacturers',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 200 },
  })

  return (
    <List headerButtons={<CreateButton />}>
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="manufacturerId">
          <Select
            {...manufacturerSelectProps}
            placeholder="メーカーで絞り込み"
            allowClear
            style={{ minWidth: 200 }}
          />
        </Form.Item>
        <Form.Item name="q">
          <Input placeholder="モデル名で検索" allowClear />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" icon={<SearchOutlined />}>検索</Button>
        </Form.Item>
      </Form>
      <Table {...tableProps} rowKey="id" scroll={{ x: true }}>
        <Table.Column
          title="メーカー"
          render={(_, record: BaseRecord) => {
            const manufacturer = record.manufacturer as { id: string; name: string } | undefined
            if (!manufacturer) return '—'
            return (
              <Link href={`/manufacturers/${manufacturer.id}`}>
                {manufacturer.name}
              </Link>
            )
          }}
        />
        <Table.Column
          dataIndex="modelName"
          title="モデル名"
          render={(v: string, record: BaseRecord) => (
            <Link href={`/bikes/${record.id as string}`}>{v}</Link>
          )}
        />
        <Table.Column dataIndex="displacement" title="排気量 (cc)" />
        <Table.Column dataIndex="modelYear" title="年式" />
        <Table.Column dataIndex="modelCode" title="型式" />
        <Table.Column
          dataIndex="settingStatus"
          title="ステータス"
          render={(v: string) => (
            <Tag color={v === 'ACTIVE' ? 'green' : 'default'}>{v}</Tag>
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
