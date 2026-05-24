'use client'

import { DateField, Show, TextField } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Tag, Typography } from 'antd'

export default function BikeShowPage() {
  const { query } = useShow()
  const { data, isLoading } = query
  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Typography.Title level={5}>メーカー</Typography.Title>
      <TextField
        value={(record?.manufacturer as { name: string })?.name ?? '—'}
      />

      <Typography.Title level={5}>モデル名</Typography.Title>
      <TextField value={record?.modelName} />

      <Typography.Title level={5}>排気量 (cc)</Typography.Title>
      <TextField value={record?.displacement} />

      <Typography.Title level={5}>年式</Typography.Title>
      <TextField value={record?.modelYear} />

      <Typography.Title level={5}>型式指定番号</Typography.Title>
      <TextField value={record?.modelCode} />

      <Typography.Title level={5}>発売年月</Typography.Title>
      <TextField value={`${record?.releaseYear}年${record?.releaseMonth}月`} />

      <Typography.Title level={5}>ステータス</Typography.Title>
      <Tag color={record?.settingStatus === 'ACTIVE' ? 'green' : 'default'}>
        {record?.settingStatus}
      </Tag>

      <Typography.Title level={5}>登録日</Typography.Title>
      <DateField value={record?.createdAt} format="YYYY/MM/DD HH:mm" />
    </Show>
  )
}
