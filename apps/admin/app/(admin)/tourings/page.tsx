'use client'

import { SearchOutlined } from '@ant-design/icons'
import { DateField, List, getDefaultSortOrder, useTable } from '@refinedev/antd'
import type { HttpError } from '@refinedev/core'
import { Button, DatePicker, Form, Input, Select, Table, Tag } from 'antd'
import { MyBikeLink, UserLink } from '@/components/HistoryLinks'
import {
  type DateRangeValue,
  buildHistoryFilters,
  getDateRangeValue,
} from '@/lib/historyFilters'
import { TOURING_STATUS_OPTIONS, type TouringRow } from '@/lib/historyRows'
import { DATE_SORT_DIRECTIONS, NOWRAP_CELL } from '@/lib/tableColumns'

type SearchForm = { q?: string; status?: string; range?: DateRangeValue }

export default function TouringListPage() {
  const { tableProps, searchFormProps, sorters, filters } = useTable<
    TouringRow,
    HttpError,
    SearchForm
  >({
    resource: 'tourings',
    syncWithLocation: true,
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
    onSearch: ({ q, status, range }) =>
      buildHistoryFilters({ q, status }, range),
  })

  return (
    <List>
      <Form
        {...searchFormProps}
        initialValues={{ range: getDateRangeValue(filters) }}
        layout="inline"
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="range" label="登録日">
          <DatePicker.RangePicker allowEmpty={[true, true]} />
        </Form.Item>
        <Form.Item name="status">
          <Select
            options={TOURING_STATUS_OPTIONS.map(({ value, label }) => ({
              value,
              label,
            }))}
            placeholder="ステータス"
            allowClear
            style={{ minWidth: 120 }}
          />
        </Form.Item>
        <Form.Item name="q">
          <Input
            placeholder="タイトル・ユーザー名で検索"
            allowClear
            style={{ minWidth: 240 }}
          />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" icon={<SearchOutlined />}>
            検索
          </Button>
        </Form.Item>
      </Form>
      <Table {...tableProps} rowKey="id" scroll={{ x: 'max-content' }}>
        <Table.Column
          dataIndex="createdAt"
          title="登録日時"
          sorter
          sortDirections={DATE_SORT_DIRECTIONS}
          onCell={NOWRAP_CELL}
          defaultSortOrder={getDefaultSortOrder('createdAt', sorters)}
          render={(v: string) => (
            <DateField value={v} format="YYYY/MM/DD HH:mm" />
          )}
        />
        <Table.Column dataIndex="title" title="タイトル" />
        <Table.Column
          dataIndex="status"
          title="ステータス"
          render={(v: TouringRow['status']) => {
            const option = TOURING_STATUS_OPTIONS.find((o) => o.value === v)
            return <Tag color={option?.color}>{option?.label ?? v}</Tag>
          }}
        />
        <Table.Column
          dataIndex="startDate"
          title="出発日"
          sorter
          sortDirections={DATE_SORT_DIRECTIONS}
          onCell={NOWRAP_CELL}
          defaultSortOrder={getDefaultSortOrder('startDate', sorters)}
          render={(v: string) => <DateField value={v} format="YYYY/MM/DD" />}
        />
        <Table.Column
          dataIndex="distance"
          title="走行距離 (km)"
          align="right"
          render={(v: number | null) => (v != null ? v.toLocaleString() : '—')}
        />
        <Table.Column
          dataIndex="userName"
          title="ユーザー"
          render={(_, row: TouringRow) => (
            <UserLink id={row.userId} name={row.userName} />
          )}
        />
        <Table.Column
          dataIndex="bikeLabel"
          title="バイク"
          render={(_, row: TouringRow) => (
            <MyBikeLink id={row.myBikeId} label={row.bikeLabel} />
          )}
        />
      </Table>
    </List>
  )
}
