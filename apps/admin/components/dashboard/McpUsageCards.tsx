'use client'

import { Card, Flex, Table, Typography } from 'antd'
import { Fragment } from 'react'
import type { DashboardMcpUsage } from '@/lib/dashboardStats'

type McpUsageCardProps = {
  usage: DashboardMcpUsage | undefined
  loading: boolean
}

const COUNT_COLUMN_WIDTH = 72

/** スネークケースのツール名を、単語の途中ではなく `_` の後で折り返す */
function ToolName({ name }: { name: string }) {
  return name.split('_').map((word, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <>
          _<wbr />
        </>
      )}
      {word}
    </Fragment>
  ))
}

function CountText({ value, unit }: { value: number; unit: string }) {
  return (
    <Typography.Text strong style={{ fontSize: 24, lineHeight: 1.2 }}>
      {value.toLocaleString()}
      <Typography.Text type="secondary" style={{ fontSize: 14 }}>
        {' '}
        {unit}
      </Typography.Text>
    </Typography.Text>
  )
}

/** 現在有効なMCP連携の数と、連携元アプリごとの内訳 */
export function McpConnectionsCard({ usage, loading }: McpUsageCardProps) {
  const connections = usage?.activeConnections

  return (
    <Card
      title="連携中のMCP"
      extra={<Typography.Text type="secondary">現在</Typography.Text>}
      loading={loading}
      style={{ height: '100%' }}
    >
      <Flex gap={32} wrap style={{ marginBottom: 16 }}>
        <Flex vertical>
          <Typography.Text type="secondary">ユーザー</Typography.Text>
          <CountText value={connections?.users ?? 0} unit="人" />
        </Flex>
        <Flex vertical>
          <Typography.Text type="secondary">連携</Typography.Text>
          <CountText value={connections?.connections ?? 0} unit="件" />
        </Flex>
      </Flex>
      <Table
        dataSource={connections?.byClient ?? []}
        rowKey="clientName"
        size="small"
        pagination={false}
        locale={{ emptyText: '連携中のアプリはありません' }}
        columns={[
          { title: '連携元アプリ', dataIndex: 'clientName' },
          {
            title: '件数',
            dataIndex: 'connections',
            align: 'right',
            width: COUNT_COLUMN_WIDTH,
            render: (v: number) => v.toLocaleString(),
          },
        ]}
      />
      <Typography.Text
        type="secondary"
        style={{ display: 'block', marginTop: 8, fontSize: 12 }}
      >
        失効しておらず、更新の期限内にある連携を数えています。
      </Typography.Text>
    </Card>
  )
}

/** 期間内のMCPツールの呼び出し回数と失敗回数（ツール別） */
export function McpToolsCard({
  usage,
  loading,
  periodLabel,
}: McpUsageCardProps & { periodLabel: string }) {
  return (
    <Card
      title="ツール別の操作数"
      extra={<Typography.Text type="secondary">{periodLabel}</Typography.Text>}
      loading={loading}
      style={{ height: '100%' }}
    >
      <Flex vertical style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">操作したユーザー</Typography.Text>
        <CountText value={usage?.toolCallUsers ?? 0} unit="人" />
      </Flex>
      <Table
        dataSource={usage?.tools ?? []}
        rowKey="toolName"
        size="small"
        pagination={false}
        scroll={{ y: 320 }}
        locale={{ emptyText: '期間内の操作はありません' }}
        columns={[
          {
            title: 'ツール',
            dataIndex: 'toolName',
            render: (v: string) => <ToolName name={v} />,
          },
          {
            title: '回数',
            dataIndex: 'calls',
            align: 'right',
            width: COUNT_COLUMN_WIDTH,
            render: (v: number) => v.toLocaleString(),
          },
          {
            title: '失敗',
            dataIndex: 'errors',
            align: 'right',
            width: COUNT_COLUMN_WIDTH,
            render: (v: number) =>
              v > 0 ? (
                <Typography.Text type="danger">
                  {v.toLocaleString()}
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary">0</Typography.Text>
              ),
          },
        ]}
      />
    </Card>
  )
}
