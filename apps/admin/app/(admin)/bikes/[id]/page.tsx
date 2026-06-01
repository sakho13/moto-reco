'use client'

import { DateField, Show } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Descriptions, Tag } from 'antd'

export default function BikeShowPage() {
  const { query } = useShow()
  const { data, isLoading } = query
  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="メーカー">
          {(record?.manufacturer as { name: string })?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="モデル名">
          {record?.modelName as string}
        </Descriptions.Item>
        <Descriptions.Item label="排気量 (cc)">
          {record?.displacement as number}
        </Descriptions.Item>
        <Descriptions.Item label="年式">
          {record?.modelYear as number}
        </Descriptions.Item>
        <Descriptions.Item label="型式指定番号">
          {record?.modelCode as string}
        </Descriptions.Item>
        <Descriptions.Item label="発売年月">
          {`${record?.releaseYear}年${record?.releaseMonth}月`}
        </Descriptions.Item>
        <Descriptions.Item label="ステータス">
          <Tag color={record?.settingStatus === 'ACTIVE' ? 'green' : 'default'}>
            {record?.settingStatus as string}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="登録日">
          {record?.createdAt ? (
            <DateField
              value={record.createdAt as string}
              format="YYYY/MM/DD HH:mm"
            />
          ) : (
            '—'
          )}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  )
}
