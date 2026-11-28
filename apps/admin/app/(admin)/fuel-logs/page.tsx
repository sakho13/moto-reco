'use client'

import { SearchOutlined } from '@ant-design/icons'
import { DateField, List, getDefaultSortOrder, useTable } from '@refinedev/antd'
import type { HttpError } from '@refinedev/core'
import { Button, DatePicker, Form, Input, Table, Tag } from 'antd'
import { MyBikeLink, UserLink } from '@/components/HistoryLinks'
import {
  type DateRangeValue,
  buildHistoryFilters,
  getDateRangeValue,
} from '@/lib/historyFilters'
import type { FuelLogRow } from '@/lib/historyRows'
import { DATE_SORT_DIRECTIONS, NOWRAP_CELL } from '@/lib/tableColumns'

type SearchForm = { q?: string; range?: DateRangeValue }

export default function FuelLogListPage() {
  const { tableProps, searchFormProps, sorters, filters } = useTable<
    FuelLogRow,
    HttpError,
    SearchForm
  >({
    resource: 'fuel-logs',
    syncWithLocation: true,
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
    onSearch: ({ q, range }) => buildHistoryFilters({ q }, range),
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
        <Form.Item name="q">
          <Input placeholder="ユーザー名で検索" allowClear />
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
        <Table.Column
          dataIndex="refueledAt"
          title="給油日"
          sorter
          sortDirections={DATE_SORT_DIRECTIONS}
          onCell={NOWRAP_CELL}
          defaultSortOrder={getDefaultSortOrder('refueledAt', sorters)}
          render={(v: string) => <DateField value={v} format="YYYY/MM/DD" />}
        />
        <Table.Column
          dataIndex="userName"
          title="ユーザー"
          render={(_, row: FuelLogRow) => (
            <UserLink id={row.userId} name={row.userName} />
          )}
        />
        <Table.Column
          dataIndex="bikeLabel"
          title="バイク"
          render={(_, row: FuelLogRow) => (
            <MyBikeLink id={row.myBikeId} label={row.bikeLabel} />
          )}
        />
        <Table.Column
          dataIndex="amount"
          title="給油量 (L)"
          align="right"
          render={(v: number) => v.toFixed(2)}
        />
        <Table.Column
          dataIndex="price"
          title="金額 (円)"
          align="right"
          render={(v: number) => v.toLocaleString()}
        />
        <Table.Column
          dataIndex="mileage"
          title="走行距離 (km)"
          align="right"
          render={(v: number) => v.toLocaleString()}
        />
        <Table.Column
          dataIndex="isFullTank"
          title="満タン"
          render={(v: boolean) =>
            v ? <Tag color="green">満タン</Tag> : <Tag>部分</Tag>
          }
        />
      </Table>
    </List>
  )
}
