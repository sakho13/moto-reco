'use client'

import { SearchOutlined } from '@ant-design/icons'
import { DateField, List, getDefaultSortOrder, useTable } from '@refinedev/antd'
import type { HttpError } from '@refinedev/core'
import { Button, DatePicker, Flex, Form, Input, Select, Table, Tag } from 'antd'
import { MyBikeLink, UserLink } from '@/components/HistoryLinks'
import {
  type DateRangeValue,
  buildHistoryFilters,
  getDateRangeValue,
} from '@/lib/historyFilters'
import type { MaintenanceLogRow } from '@/lib/historyRows'
import {
  MAINTENANCE_TYPE_OPTIONS,
  getMaintenanceTypeLabel,
} from '@/lib/maintenanceType'
import { DATE_SORT_DIRECTIONS, NOWRAP_CELL } from '@/lib/tableColumns'

type SearchForm = { q?: string; type?: string; range?: DateRangeValue }

export default function MaintenanceLogListPage() {
  const { tableProps, searchFormProps, sorters, filters } = useTable<
    MaintenanceLogRow,
    HttpError,
    SearchForm
  >({
    resource: 'maintenance-logs',
    syncWithLocation: true,
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
    onSearch: ({ q, type, range }) => buildHistoryFilters({ q, type }, range),
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
        <Form.Item name="type">
          <Select
            options={[...MAINTENANCE_TYPE_OPTIONS]}
            placeholder="メンテナンス項目"
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            style={{ minWidth: 200 }}
          />
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
          dataIndex="performedAt"
          title="実施日"
          sorter
          sortDirections={DATE_SORT_DIRECTIONS}
          onCell={NOWRAP_CELL}
          defaultSortOrder={getDefaultSortOrder('performedAt', sorters)}
          render={(v: string) => <DateField value={v} format="YYYY/MM/DD" />}
        />
        <Table.Column
          dataIndex="itemTypes"
          title="項目"
          render={(types: string[]) => (
            <Flex wrap gap={4}>
              {types.map((type) => (
                <Tag key={type}>{getMaintenanceTypeLabel(type)}</Tag>
              ))}
            </Flex>
          )}
        />
        <Table.Column
          dataIndex="mileage"
          title="走行距離 (km)"
          align="right"
          render={(v: number) => v.toLocaleString()}
        />
        <Table.Column
          dataIndex="userName"
          title="ユーザー"
          render={(_, row: MaintenanceLogRow) => (
            <UserLink id={row.userId} name={row.userName} />
          )}
        />
        <Table.Column
          dataIndex="bikeLabel"
          title="バイク"
          render={(_, row: MaintenanceLogRow) => (
            <MyBikeLink id={row.myBikeId} label={row.bikeLabel} />
          )}
        />
      </Table>
    </List>
  )
}
