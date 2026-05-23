'use client'

import { DateField, Show, TextField } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import { Tag, Typography } from 'antd'

const statusColor: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
  SUSPENDED: 'red',
}

const roleColor: Record<string, string> = {
  ADMIN: 'gold',
  USER: 'blue',
  GUEST: 'default',
}

export default function UserShowPage() {
  const { query } = useShow()
  const { data, isLoading } = query
  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Typography.Title level={5}>ID</Typography.Title>
      <TextField value={record?.id} />

      <Typography.Title level={5}>名前</Typography.Title>
      <TextField value={record?.name} />

      <Typography.Title level={5}>通知メール</Typography.Title>
      <TextField value={record?.notificationEmail ?? '未設定'} />

      <Typography.Title level={5}>ステータス</Typography.Title>
      <Tag color={statusColor[record?.status] ?? 'default'}>
        {record?.status}
      </Tag>

      <Typography.Title level={5}>ロール</Typography.Title>
      <Tag color={roleColor[record?.role] ?? 'default'}>{record?.role}</Tag>

      <Typography.Title level={5}>プロフィール公開</Typography.Title>
      <TextField value={record?.isProfilePublic ? '公開' : '非公開'} />

      <Typography.Title level={5}>登録日</Typography.Title>
      <DateField value={record?.createdAt} format="YYYY/MM/DD HH:mm" />

      <Typography.Title level={5}>更新日</Typography.Title>
      <DateField value={record?.updatedAt} format="YYYY/MM/DD HH:mm" />
    </Show>
  )
}
