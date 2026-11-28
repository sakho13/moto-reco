'use client'

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Card, Flex, Typography, theme } from 'antd'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import type {
  DashboardDailyCounts,
  DashboardMetricKey,
} from '@/lib/dashboardStats'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

/** recharts の barCategoryGap は棒の両側に入る。これを超える日数では割合で取る */
const DENSE_DAYS = 30
const DENSE_BAR_CATEGORY_GAP = '12%'

/** YYYY-MM-DD を M/D（曜日）に整える */
function formatMonthDay(date: string, withWeekday = false): string {
  const [, month, day] = date.split('-').map(Number)
  if (!withWeekday) return `${month}/${day}`
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]
  return `${month}/${day}（${weekday}）`
}

type MetricCardProps = {
  title: string
  description: string
  metric: DashboardMetricKey
  unit: string
  total: number
  previous: number
  previousLabel: string
  daily: DashboardDailyCounts[]
  loading: boolean
}

export function MetricCard({
  title,
  description,
  metric,
  unit,
  total,
  previous,
  previousLabel,
  daily,
  loading,
}: MetricCardProps) {
  const { token } = theme.useToken()
  const diff = total - previous
  const firstDate = daily[0]?.date
  const lastDate = daily[daily.length - 1]?.date

  return (
    <Card
      loading={loading}
      style={{ height: '100%' }}
      styles={{
        body: {
          padding: 20,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Flex vertical gap={4}>
        <Typography.Text type="secondary">{title}</Typography.Text>
        <Typography.Text strong style={{ fontSize: 28, lineHeight: 1.2 }}>
          {total.toLocaleString()}
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            {' '}
            {unit}
          </Typography.Text>
        </Typography.Text>
        <Typography.Text style={{ fontSize: 12 }}>
          <DiffLabel diff={diff} unit={unit} />
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, whiteSpace: 'nowrap' }}
          >
            {' '}
            （{previousLabel}: {previous.toLocaleString()}
            {unit}）
          </Typography.Text>
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {description}
        </Typography.Text>
      </Flex>
      <div
        style={{ height: 72, marginTop: 'auto', paddingTop: 12 }}
        role="img"
        aria-label={`${title}の日別の推移`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={daily}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            barCategoryGap={
              daily.length > DENSE_DAYS ? DENSE_BAR_CATEGORY_GAP : 1
            }
          >
            <XAxis
              dataKey="date"
              ticks={firstDate && lastDate ? [firstDate, lastDate] : []}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: token.colorBorderSecondary }}
              height={20}
              tick={({ x, y, payload }) => (
                <text
                  x={x}
                  y={Number(y) + 12}
                  fontSize={11}
                  fill={token.colorTextTertiary}
                  textAnchor={payload.value === firstDate ? 'start' : 'end'}
                >
                  {formatMonthDay(String(payload.value))}
                </text>
              )}
            />
            <Tooltip
              cursor={{ fill: token.colorFillTertiary }}
              isAnimationActive={false}
              content={<DailyTooltip metric={metric} unit={unit} />}
            />
            <Bar
              dataKey={metric}
              fill={token.colorPrimary}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function DiffLabel({ diff, unit }: { diff: number; unit: string }) {
  const { token } = theme.useToken()
  if (diff === 0) {
    return <Typography.Text type="secondary">増減なし</Typography.Text>
  }
  const isUp = diff > 0
  return (
    <Typography.Text
      style={{ color: isUp ? token.colorSuccessText : token.colorErrorText }}
    >
      {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {isUp ? '+' : '−'}
      {Math.abs(diff).toLocaleString()}
      {unit}
    </Typography.Text>
  )
}

type DailyTooltipProps = {
  metric: DashboardMetricKey
  unit: string
  active?: boolean
  payload?: Array<{ payload: DashboardDailyCounts }>
}

function DailyTooltip({ metric, unit, active, payload }: DailyTooltipProps) {
  const { token } = theme.useToken()
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  return (
    <div
      style={{
        background: token.colorBgElevated,
        boxShadow: token.boxShadowSecondary,
        borderRadius: token.borderRadius,
        padding: '6px 10px',
      }}
    >
      <Typography.Text strong>
        {row[metric].toLocaleString()}
        {unit}
      </Typography.Text>{' '}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {formatMonthDay(row.date, true)}
      </Typography.Text>
    </div>
  )
}
