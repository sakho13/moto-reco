'use client'

import { DateField, Show, TextField } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Tag, Typography } from 'antd'

export default function ManufacturerShowPage() {
  const { query } = useShow()
  const { data, isLoading } = query
  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Typography.Title level={5}>メーカー名</Typography.Title>
      <TextField value={record?.name} />

      <Typography.Title level={5}>英語名</Typography.Title>
      <TextField value={record?.nameEn ?? '—'} />

      <Typography.Title level={5}>国</Typography.Title>
      <TextField value={record?.country ?? '—'} />

      <Typography.Title level={5}>公式サイト</Typography.Title>
      <TextField value={record?.websiteUrl ?? '—'} />

      <Typography.Title level={5}>ロゴ URL</Typography.Title>
      <TextField value={record?.logoUrl ?? '—'} />

      <Typography.Title level={5}>有効</Typography.Title>
      <Tag color={record?.isActive ? 'green' : 'default'}>
        {record?.isActive ? '有効' : '無効'}
      </Tag>

      <Typography.Title level={5}>登録日</Typography.Title>
      <DateField value={record?.createdAt} format="YYYY/MM/DD HH:mm" />
    </Show>
  )
}
