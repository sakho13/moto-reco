'use client'

import { DateField, useTable } from '@refinedev/antd'
import { useCustomMutation } from '@refinedev/core'
import {
  Button,
  Form,
  Input,
  Select,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/config'

type UserOption = { label: string; value: string }

type NotificationRow = {
  id: string
  userId: string
  userName: string
  notificationEmail: string | null
  type: string
  title: string
  body: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

const TYPE_LABEL: Record<string, string> = {
  FOLLOWED: 'フォロー',
  ADMIN_MESSAGE: '管理者メッセージ',
}

const TYPE_COLOR: Record<string, string> = {
  FOLLOWED: 'blue',
  ADMIN_MESSAGE: 'purple',
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth()
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) return {}
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

function BroadcastForm() {
  const [form] = Form.useForm()
  const { mutate, mutation } = useCustomMutation()

  const handleSubmit = (values: { title: string; body: string }) => {
    mutate(
      {
        url: '/api/admin/notifications/broadcast',
        method: 'post',
        values,
      },
      {
        onSuccess: () => {
          void message.success('システム通知を送信しました')
          form.resetFields()
        },
        onError: () => {
          void message.error('送信に失敗しました')
        },
      }
    )
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Typography.Paragraph type="secondary">
        全ユーザーに表示されるシステムアナウンスを即時公開します。
      </Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="タイトル"
          name="title"
          rules={[
            { required: true, message: 'タイトルは必須です' },
            { max: 100, message: '100文字以内で入力してください' },
          ]}
        >
          <Input placeholder="例: メンテナンスのお知らせ" maxLength={100} />
        </Form.Item>
        <Form.Item
          label="本文"
          name="body"
          rules={[
            { required: true, message: '本文は必須です' },
            { max: 1000, message: '1000文字以内で入力してください' },
          ]}
        >
          <Input.TextArea
            rows={5}
            placeholder="内容を入力してください"
            maxLength={1000}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            全員に送信
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

function SendForm() {
  const [form] = Form.useForm()
  const { mutate, mutation } = useCustomMutation()
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUserSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUserOptions([])
      return
    }
    setSearching(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q)}&_start=0&_end=10`,
        { headers }
      )
      if (!res.ok) return
      const data = (await res.json()) as Array<{
        id: string
        name: string
        notificationEmail: string | null
      }>
      setUserOptions(
        data.map((u) => ({
          value: u.id,
          label: `${u.name}${u.notificationEmail ? ` (${u.notificationEmail})` : ''}`,
        }))
      )
    } finally {
      setSearching(false)
    }
  }, [])

  const onSearch = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void handleUserSearch(q)
    }, 300)
  }

  const handleSubmit = (values: {
    userId: string
    title: string
    body: string
  }) => {
    mutate(
      {
        url: '/api/admin/notifications/send',
        method: 'post',
        values,
      },
      {
        onSuccess: () => {
          void message.success('通知を送信しました')
          form.resetFields()
          setUserOptions([])
        },
        onError: () => {
          void message.error('送信に失敗しました')
        },
      }
    )
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Typography.Paragraph type="secondary">
        特定のユーザーに個別の通知メッセージを送信します。
      </Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="送信先ユーザー"
          name="userId"
          rules={[{ required: true, message: 'ユーザーを選択してください' }]}
        >
          <Select
            showSearch
            placeholder="名前またはメールアドレスで検索"
            filterOption={false}
            options={userOptions}
            onSearch={onSearch}
            loading={searching}
            notFoundContent={searching ? '検索中...' : '一致するユーザーなし'}
          />
        </Form.Item>
        <Form.Item
          label="タイトル"
          name="title"
          rules={[
            { required: true, message: 'タイトルは必須です' },
            { max: 100, message: '100文字以内で入力してください' },
          ]}
        >
          <Input placeholder="例: 重要なお知らせ" maxLength={100} />
        </Form.Item>
        <Form.Item
          label="本文"
          name="body"
          rules={[
            { required: true, message: '本文は必須です' },
            { max: 1000, message: '1000文字以内で入力してください' },
          ]}
        >
          <Input.TextArea
            rows={5}
            placeholder="内容を入力してください"
            maxLength={1000}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            送信
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

function HistoryTable() {
  const { tableProps, searchFormProps } = useTable<NotificationRow>({
    resource: 'notifications',
    syncWithLocation: false,
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  })

  return (
    <>
      <Form form={searchFormProps.form}>{null}</Form>
      <Table<NotificationRow> {...tableProps} rowKey="id" size="small">
        <Table.Column
          dataIndex="userName"
          title="受信者"
          render={(v: string, record: NotificationRow) => (
            <Link href={`/users/${record.userId}`}>{v}</Link>
          )}
        />
        <Table.Column
          dataIndex="notificationEmail"
          title="通知メール"
          render={(v: string | null) => v ?? '—'}
        />
        <Table.Column
          dataIndex="type"
          title="種別"
          width={140}
          render={(v: string) => (
            <Tag color={TYPE_COLOR[v] ?? 'default'}>{TYPE_LABEL[v] ?? v}</Tag>
          )}
        />
        <Table.Column dataIndex="title" title="タイトル" />
        <Table.Column
          dataIndex="isRead"
          title="既読"
          width={70}
          align="center"
          render={(v: boolean) =>
            v ? <Tag color="green">既読</Tag> : <Tag color="default">未読</Tag>
          }
        />
        <Table.Column
          dataIndex="createdAt"
          title="送信日時"
          width={150}
          render={(v: string) => (
            <DateField value={v} format="YYYY/MM/DD HH:mm" />
          )}
        />
      </Table>
    </>
  )
}

export default function NotificationsPage() {
  return (
    <div style={{ padding: '0 24px' }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        通知管理
      </Typography.Title>
      <Tabs
        defaultActiveKey="broadcast"
        items={[
          {
            key: 'broadcast',
            label: 'システム通知（全員）',
            children: <BroadcastForm />,
          },
          {
            key: 'send',
            label: '個別通知',
            children: <SendForm />,
          },
          {
            key: 'history',
            label: '通知履歴',
            children: <HistoryTable />,
          },
        ]}
      />
    </div>
  )
}
