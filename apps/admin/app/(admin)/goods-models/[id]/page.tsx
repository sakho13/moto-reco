'use client'

import { DateField, Show } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Descriptions, Tag } from 'antd'
import { getGoodsCategoryLabel } from '@/lib/goodsCategory'

export default function GoodsModelShowPage() {
  const { query } = useShow()
  const { data, isLoading } = query
  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="メーカー">
          {(record?.manufacturer as { name: string })?.name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="商品名">
          {record?.name as string}
        </Descriptions.Item>
        <Descriptions.Item label="型番">
          {record?.modelNumber as string}
        </Descriptions.Item>
        <Descriptions.Item label="カテゴリ">
          <Tag>{getGoodsCategoryLabel(record?.category as string)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Amazon ASIN">
          {(record?.amazonAsin as string) ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="楽天商品ID">
          {(record?.rakutenItemId as string) ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="公式サイトURL">
          {record?.officialUrl ? (
            <a
              href={record.officialUrl as string}
              target="_blank"
              rel="noopener noreferrer"
            >
              {record.officialUrl as string}
            </a>
          ) : (
            '—'
          )}
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
