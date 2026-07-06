'use client'

import { DateField, Show } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Descriptions, Tag } from 'antd'

export default function GoodsManufacturerShowPage() {
  const { query } = useShow()
  const { data, isLoading } = query
  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="メーカー名">
          {record?.name as string}
        </Descriptions.Item>
        <Descriptions.Item label="英語名">
          {(record?.nameEn as string) ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="公式サイト">
          {(record?.websiteUrl as string) ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="ロゴ URL">
          {(record?.logoUrl as string) ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="有効">
          <Tag color={record?.isActive ? 'green' : 'default'}>
            {record?.isActive ? '有効' : '無効'}
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
