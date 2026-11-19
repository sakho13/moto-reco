'use client'

import { DateField } from '@refinedev/antd'
import { useApiUrl, useCustom } from '@refinedev/core'
import {
  Alert,
  Button,
  Col,
  Flex,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { useState } from 'react'
import { getMaintenanceTypeName } from '@repo/shared-types'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { RecentRecordsCard } from '@/components/dashboard/RecentRecordsCard'
import { MyBikeLink, UserLink } from '@/components/HistoryLinks'
import type { DashboardMetricKey, DashboardStats } from '@/lib/dashboardStats'
import {
  type FuelLogRow,
  type MaintenanceLogRow,
  TOURING_STATUS_OPTIONS,
  type TouringRow,
} from '@/lib/historyRows'
import { STATS_PERIOD_DAYS, type StatsPeriodDays } from '@/lib/jstPeriod'
import { NOWRAP_CELL } from '@/lib/tableColumns'
import { USER_ROLE_COLOR } from '@/lib/userTags'

type MetricDefinition = {
  metric: DashboardMetricKey
  title: string
  description: string
  unit: string
}

const USER_METRICS: MetricDefinition[] = [
  {
    metric: 'newUsers',
    title: '新規ユーザー',
    description: '期間内に登録したユーザー',
    unit: '人',
  },
  {
    metric: 'activeUsers',
    title: 'アクティブユーザー',
    description:
      '期間内に給油・ツーリング・メンテナンスのいずれかを登録したユーザー',
    unit: '人',
  },
]

const RECORD_METRICS: MetricDefinition[] = [
  {
    metric: 'fuelLogs',
    title: '給油',
    description: '期間内に登録された給油記録',
    unit: '件',
  },
  {
    metric: 'tourings',
    title: 'ツーリング',
    description: '期間内に登録されたツーリング',
    unit: '件',
  },
  {
    metric: 'maintenances',
    title: 'メンテナンス',
    description: '期間内に登録されたメンテナンス記録',
    unit: '件',
  },
]

type UserRow = {
  id: string
  name: string
  role: string
  createdAt: string
}

const renderCreatedAt = (v: string) => (
  <DateField value={v} format="MM/DD HH:mm" />
)

const USER_COLUMNS: TableColumnsType<UserRow> = [
  {
    title: '登録日時',
    dataIndex: 'createdAt',
    render: renderCreatedAt,
    onCell: NOWRAP_CELL,
  },
  {
    title: '名前',
    dataIndex: 'name',
    render: (_, row) => <UserLink id={row.id} name={row.name} />,
  },
  {
    title: 'ロール',
    dataIndex: 'role',
    render: (v: string) => (
      <Tag color={USER_ROLE_COLOR[v] ?? 'default'}>{v}</Tag>
    ),
  },
]

const FUEL_LOG_COLUMNS: TableColumnsType<FuelLogRow> = [
  {
    title: '登録日時',
    dataIndex: 'createdAt',
    render: renderCreatedAt,
    onCell: NOWRAP_CELL,
  },
  {
    title: 'ユーザー',
    dataIndex: 'userName',
    render: (_, row) => <UserLink id={row.userId} name={row.userName} />,
  },
  {
    title: 'バイク',
    dataIndex: 'bikeLabel',
    render: (_, row) => <MyBikeLink id={row.myBikeId} label={row.bikeLabel} />,
  },
  {
    title: '給油量 (L)',
    dataIndex: 'amount',
    align: 'right',
    render: (v: number) => v.toFixed(2),
  },
]

const TOURING_COLUMNS: TableColumnsType<TouringRow> = [
  {
    title: '登録日時',
    dataIndex: 'createdAt',
    render: renderCreatedAt,
    onCell: NOWRAP_CELL,
  },
  { title: 'タイトル', dataIndex: 'title', ellipsis: true },
  {
    title: 'ステータス',
    dataIndex: 'status',
    render: (v: TouringRow['status']) => {
      const option = TOURING_STATUS_OPTIONS.find((o) => o.value === v)
      return <Tag color={option?.color}>{option?.label ?? v}</Tag>
    },
  },
  {
    title: 'ユーザー',
    dataIndex: 'userName',
    render: (_, row) => <UserLink id={row.userId} name={row.userName} />,
  },
]

const MAINTENANCE_LOG_COLUMNS: TableColumnsType<MaintenanceLogRow> = [
  {
    title: '登録日時',
    dataIndex: 'createdAt',
    render: renderCreatedAt,
    onCell: NOWRAP_CELL,
  },
  {
    title: '項目',
    dataIndex: 'itemTypes',
    render: (types: string[]) => {
      const [first, ...rest] = types
      if (!first) return '—'
      return (
        <>
          {getMaintenanceTypeName(first)}
          {rest.length > 0 && (
            <Typography.Text type="secondary">
              {' '}
              ほか{rest.length}件
            </Typography.Text>
          )}
        </>
      )
    },
  },
  {
    title: 'ユーザー',
    dataIndex: 'userName',
    render: (_, row) => <UserLink id={row.userId} name={row.userName} />,
  },
  {
    title: 'バイク',
    dataIndex: 'bikeLabel',
    render: (_, row) => <MyBikeLink id={row.myBikeId} label={row.bikeLabel} />,
  },
]

const PERIOD_OPTIONS = STATS_PERIOD_DAYS.map((days) => ({
  value: days,
  label: `${days}日間`,
}))

const formatPeriodDate = (date: string) => date.replaceAll('-', '/')

export default function DashboardPage() {
  const [days, setDays] = useState<StatsPeriodDays>(7)
  const apiUrl = useApiUrl()
  const { result, query } = useCustom<DashboardStats>({
    url: `${apiUrl}/dashboard/stats`,
    method: 'get',
    config: { query: { days } },
  })
  const stats = query.isSuccess ? result.data : undefined
  const loading = query.isPending || query.isFetching

  const renderMetrics = (definitions: MetricDefinition[], span: number) =>
    definitions.map((definition) => (
      <Col key={definition.metric} xs={24} md={span}>
        <MetricCard
          {...definition}
          total={stats?.totals[definition.metric] ?? 0}
          previous={stats?.previous[definition.metric] ?? 0}
          previousLabel={`前の${days}日間`}
          daily={stats?.daily ?? []}
          loading={loading}
        />
      </Col>
    ))

  return (
    <Flex vertical gap={24}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          ダッシュボード
        </Typography.Title>
        <Space wrap>
          {stats && (
            <Typography.Text type="secondary">
              {formatPeriodDate(stats.period.from)} 〜{' '}
              {formatPeriodDate(stats.period.to)}
            </Typography.Text>
          )}
          <Segmented<StatsPeriodDays>
            options={PERIOD_OPTIONS}
            value={days}
            onChange={setDays}
          />
        </Space>
      </Flex>

      {query.isError && !query.isFetching && (
        <Alert
          type="error"
          showIcon
          title="統計を取得できませんでした"
          action={
            <Button
              type="link"
              size="small"
              onClick={() => void query.refetch()}
            >
              再読み込み
            </Button>
          }
        />
      )}

      <section>
        <Typography.Title level={5}>ユーザー</Typography.Title>
        <Row gutter={[16, 16]}>{renderMetrics(USER_METRICS, 12)}</Row>
      </section>

      <section>
        <Typography.Title level={5}>記録</Typography.Title>
        <Row gutter={[16, 16]}>{renderMetrics(RECORD_METRICS, 8)}</Row>
      </section>

      <section>
        <Typography.Title level={5}>直近の登録</Typography.Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <RecentRecordsCard<UserRow>
              title="ユーザー"
              resource="users"
              listPath="/users"
              columns={USER_COLUMNS}
            />
          </Col>
          <Col xs={24} xl={12}>
            <RecentRecordsCard<FuelLogRow>
              title="給油"
              resource="fuel-logs"
              listPath="/fuel-logs"
              columns={FUEL_LOG_COLUMNS}
            />
          </Col>
          <Col xs={24} xl={12}>
            <RecentRecordsCard<TouringRow>
              title="ツーリング"
              resource="tourings"
              listPath="/tourings"
              columns={TOURING_COLUMNS}
            />
          </Col>
          <Col xs={24} xl={12}>
            <RecentRecordsCard<MaintenanceLogRow>
              title="メンテナンス"
              resource="maintenance-logs"
              listPath="/maintenance-logs"
              columns={MAINTENANCE_LOG_COLUMNS}
            />
          </Col>
        </Row>
      </section>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        期間はJSTの日付で区切っています。
      </Typography.Text>
    </Flex>
  )
}
