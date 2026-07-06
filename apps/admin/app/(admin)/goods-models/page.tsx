'use client'

import { SearchOutlined } from '@ant-design/icons'
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
import type { BaseRecord, CrudFilters } from '@refinedev/core'
import { Button, Form, Input, Select, Space, Table, Tag } from 'antd'
import Link from 'next/link'
import {
  GOODS_CATEGORY_OPTIONS,
  getGoodsCategoryLabel,
} from '@/lib/goodsCategory'

type SearchForm = { q: string; goodsManufacturerId: string; category: string }

export default function GoodsModelListPage() {
  const { tableProps, searchFormProps } = useTable<
    BaseRecord,
    never,
    SearchForm
  >({
    syncWithLocation: true,
    resource: 'goods-models',
    onSearch: ({ q, goodsManufacturerId, category }) => {
      const filters: CrudFilters = []
      if (q) filters.push({ field: 'q', operator: 'eq', value: q })
      if (goodsManufacturerId)
        filters.push({
          field: 'goodsManufacturerId',
          operator: 'eq',
          value: goodsManufacturerId,
        })
      if (category)
        filters.push({ field: 'category', operator: 'eq', value: category })
      return filters
    },
  })

  const { selectProps: manufacturerSelectProps } = useSelect({
    resource: 'goods-manufacturers',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 200 },
  })

  return (
    <List headerButtons={<CreateButton />}>
      <Form {...searchFormProps} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="goodsManufacturerId">
          <Select
            {...manufacturerSelectProps}
            placeholder="メーカーで絞り込み"
            allowClear
            style={{ minWidth: 200 }}
          />
        </Form.Item>
        <Form.Item name="category">
          <Select
            options={
              GOODS_CATEGORY_OPTIONS as unknown as {
                value: string
                label: string
              }[]
            }
            placeholder="カテゴリで絞り込み"
            allowClear
            style={{ minWidth: 160 }}
          />
        </Form.Item>
        <Form.Item name="q">
          <Input placeholder="商品名・型番で検索" allowClear />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" icon={<SearchOutlined />}>
            検索
          </Button>
        </Form.Item>
      </Form>
      <Table {...tableProps} rowKey="id" scroll={{ x: true }}>
        <Table.Column
          title="メーカー"
          render={(_, record: BaseRecord) => {
            const manufacturer = record.manufacturer as
              | { id: string; name: string }
              | undefined
            if (!manufacturer) return '—'
            return (
              <Link href={`/goods-manufacturers/${manufacturer.id}`}>
                {manufacturer.name}
              </Link>
            )
          }}
        />
        <Table.Column
          dataIndex="name"
          title="商品名"
          render={(v: string, record: BaseRecord) => (
            <Link href={`/goods-models/${record.id as string}`}>{v}</Link>
          )}
        />
        <Table.Column dataIndex="modelNumber" title="型番" />
        <Table.Column
          dataIndex="category"
          title="カテゴリ"
          render={(v: string) => <Tag>{getGoodsCategoryLabel(v)}</Tag>}
        />
        <Table.Column dataIndex="amazonAsin" title="Amazon ASIN" />
        <Table.Column dataIndex="rakutenItemId" title="楽天商品ID" />
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
              <ShowButton hideText size="middle" recordItemId={record.id} />
              <EditButton hideText size="middle" recordItemId={record.id} />
              <DeleteButton hideText size="middle" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  )
}
