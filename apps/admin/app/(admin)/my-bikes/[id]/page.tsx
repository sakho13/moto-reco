'use client'

import { DateField, Show } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Descriptions, Table, Tabs, Tag, Typography } from 'antd'

const MAINTENANCE_TYPE_LABEL: Record<string, string> = {
  BRAKE_FLUID: 'ブレーキフルード',
  FRONT_BRAKE_PAD: 'フロントブレーキパッド',
  REAR_BRAKE_PAD: 'リアブレーキパッド',
  MASTER_CYLINDER_CUP: 'マスターシリンダーカップ',
  BRAKE_CALIPER_SEAL: 'ブレーキキャリパーシール',
  BRAKE_CABLE: 'ブレーキケーブル',
  SPARK_PLUG: 'スパークプラグ',
  COOLANT: 'クーラント',
  ENGINE_OIL: 'エンジンオイル',
  OIL_CLEANER: 'オイルフィルター',
  TRANSMISSION_OIL: 'トランスミッションオイル',
  DRIVE_CHAIN: 'ドライブチェーン',
  DRIVE_BELT: 'ドライブベルト',
  FRONT_TIRE: 'フロントタイヤ',
  REAR_TIRE: 'リアタイヤ',
  BATTERY: 'バッテリー',
  LIGHT: 'ライト',
  TURN_SIGNAL: 'ウインカー',
  HORN: 'ホーン',
}

const ownStatusColor: Record<string, string> = {
  OWN: 'green',
  SOLD: 'default',
  TRANSFERRED: 'orange',
  SCRAPPED: 'red',
}

const touringStatusColor: Record<string, string> = {
  STARTED: 'blue',
  COMPLETED: 'green',
}

type MaintenanceItem = {
  id: string
  type: string
  value: number | null
}

type FuelLog = {
  id: string
  amount: number
  price: number
  mileage: number
  previousMileage: number
  refueledAt: string
  memo: string | null
}

type MaintenanceLog = {
  id: string
  performedAt: string
  mileage: number
  memo: string | null
  maintenanceItems: MaintenanceItem[]
}

type Touring = {
  id: string
  title: string
  startDate: string
  endDate: string
  startMileage: number | null
  endMileage: number | null
  status: string
}

export default function MyBikeShowPage() {
  const { query } = useShow({ resource: 'my-bikes' })
  const { data, isLoading } = query
  const record = data?.data

  const bike = record?.userBike?.bike
  const fuelLogs: FuelLog[] = (record?.fuelLogs ?? []) as FuelLog[]
  const maintenanceLogs: MaintenanceLog[] = (record?.maintenanceLogs ??
    []) as MaintenanceLog[]
  const tourings: Touring[] = (record?.tourings ?? []) as Touring[]

  return (
    <Show isLoading={isLoading} title={record?.nickname ?? 'マイバイク詳細'}>
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="ニックネーム">
          {record?.nickname ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="ステータス">
          <Tag color={ownStatusColor[record?.ownStatus] ?? 'default'}>
            {record?.ownStatus}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="メーカー">
          {bike?.manufacturer?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="モデル名">
          {bike?.modelName ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="年式">
          {bike?.modelYear ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="総走行距離">
          {record?.userBike?.totalMileage != null
            ? `${record.userBike.totalMileage.toLocaleString()} km`
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="所有開始日">
          {record?.ownedAt ? (
            <DateField value={record.ownedAt} format="YYYY/MM/DD" />
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="売却日">
          {record?.soldAt ? (
            <DateField value={record.soldAt} format="YYYY/MM/DD" />
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="ユーザー">
          {record?.user?.name ?? '—'}
        </Descriptions.Item>
      </Descriptions>

      <Tabs
        items={[
          {
            key: 'fuel',
            label: `給油履歴 (${fuelLogs.length})`,
            children: (
              <Table<FuelLog>
                dataSource={fuelLogs}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                scroll={{ x: true }}
              >
                <Table.Column
                  title="給油日"
                  dataIndex="refueledAt"
                  render={(v: string) => (
                    <DateField value={v} format="YYYY/MM/DD" />
                  )}
                />
                <Table.Column
                  title="給油量 (L)"
                  dataIndex="amount"
                  render={(v: number) => v.toFixed(2)}
                />
                <Table.Column
                  title="価格 (円)"
                  dataIndex="price"
                  render={(v: number) => v.toLocaleString()}
                />
                <Table.Column
                  title="走行距離 (km)"
                  dataIndex="mileage"
                  render={(v: number) => v.toLocaleString()}
                />
                <Table.Column
                  title="前回走行距離 (km)"
                  dataIndex="previousMileage"
                  render={(v: number) => v.toLocaleString()}
                />
                <Table.Column
                  title="区間距離 (km)"
                  render={(_: unknown, row: FuelLog) =>
                    (row.mileage - row.previousMileage).toLocaleString()
                  }
                />
                <Table.Column
                  title="燃費 (km/L)"
                  render={(_: unknown, row: FuelLog) => {
                    const dist = row.mileage - row.previousMileage
                    return dist > 0 ? (dist / row.amount).toFixed(1) : '—'
                  }}
                />
                <Table.Column
                  title="メモ"
                  dataIndex="memo"
                  render={(v: string | null) => v ?? '—'}
                />
              </Table>
            ),
          },
          {
            key: 'maintenance',
            label: `メンテナンス履歴 (${maintenanceLogs.length})`,
            children: (
              <Table<MaintenanceLog>
                dataSource={maintenanceLogs}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                scroll={{ x: true }}
                expandable={{
                  expandedRowRender: (row) => (
                    <Table<MaintenanceItem>
                      dataSource={row.maintenanceItems}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    >
                      <Table.Column
                        title="種別"
                        dataIndex="type"
                        render={(v: string) => MAINTENANCE_TYPE_LABEL[v] ?? v}
                      />
                      <Table.Column
                        title="値"
                        dataIndex="value"
                        render={(v: number | null) =>
                          v != null ? v.toString() : '—'
                        }
                      />
                    </Table>
                  ),
                  rowExpandable: (row) => row.maintenanceItems.length > 0,
                }}
              >
                <Table.Column
                  title="実施日"
                  dataIndex="performedAt"
                  render={(v: string) => (
                    <DateField value={v} format="YYYY/MM/DD" />
                  )}
                />
                <Table.Column
                  title="走行距離 (km)"
                  dataIndex="mileage"
                  render={(v: number) => v.toLocaleString()}
                />
                <Table.Column
                  title="項目数"
                  render={(_: unknown, row: MaintenanceLog) =>
                    row.maintenanceItems.length
                  }
                />
                <Table.Column
                  title="メモ"
                  dataIndex="memo"
                  render={(v: string | null) => v ?? '—'}
                />
              </Table>
            ),
          },
          {
            key: 'touring',
            label: `ツーリング履歴 (${tourings.length})`,
            children: (
              <Table<Touring>
                dataSource={tourings}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                scroll={{ x: true }}
              >
                <Table.Column title="タイトル" dataIndex="title" />
                <Table.Column
                  title="出発日"
                  dataIndex="startDate"
                  render={(v: string) => (
                    <DateField value={v} format="YYYY/MM/DD" />
                  )}
                />
                <Table.Column
                  title="終了日"
                  dataIndex="endDate"
                  render={(v: string) => (
                    <DateField value={v} format="YYYY/MM/DD" />
                  )}
                />
                <Table.Column
                  title="出発時走行距離 (km)"
                  dataIndex="startMileage"
                  render={(v: number | null) =>
                    v != null ? v.toLocaleString() : '—'
                  }
                />
                <Table.Column
                  title="終了時走行距離 (km)"
                  dataIndex="endMileage"
                  render={(v: number | null) =>
                    v != null ? v.toLocaleString() : '—'
                  }
                />
                <Table.Column
                  title="走行距離 (km)"
                  render={(_: unknown, row: Touring) =>
                    row.startMileage != null && row.endMileage != null
                      ? (row.endMileage - row.startMileage).toLocaleString()
                      : '—'
                  }
                />
                <Table.Column
                  title="ステータス"
                  dataIndex="status"
                  render={(v: string) => (
                    <Tag color={touringStatusColor[v] ?? 'default'}>
                      {v === 'COMPLETED' ? '完了' : '走行中'}
                    </Tag>
                  )}
                />
              </Table>
            ),
          },
        ]}
      />

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        ※ メンテナンス履歴は行を展開すると詳細項目を確認できます
      </Typography.Text>
    </Show>
  )
}
