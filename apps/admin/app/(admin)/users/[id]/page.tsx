'use client'

import { DateField, Show } from '@refinedev/antd'
import { useShow } from '@refinedev/core'
import {
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/config'

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

const planColor: Record<string, string> = {
  FREE: 'default',
  PREMIUM: 'gold',
}

const ownStatusColor: Record<string, string> = {
  OWN: 'green',
  SOLD: 'default',
}

const providerLabel: Record<string, string> = {
  FIREBASE_EMAIL: 'メール',
  FIREBASE_GOOGLE: 'Google',
  FIREBASE_ANONYMOUS: '匿名',
}

type AuthProvider = {
  providerType: string
  externalId: string
  isActive: boolean
}

type MyBike = {
  id: string
  nickname: string | null
  ownStatus: string
  ownedAt: string | null
  soldAt: string | null
  userBike: {
    totalMileage: number | null
    bike: {
      modelName: string
      modelYear: number | null
      manufacturer: { id: string; name: string }
    } | null
  }
}

type PlanHistory = {
  id: string
  plan: 'FREE' | 'PREMIUM'
  changedAt: string
  changedByName: string
  reason: string | null
}

type ChangePlanForm = {
  plan: 'FREE' | 'PREMIUM'
  reason?: string
}

export default function UserShowPage() {
  const { query } = useShow()
  const { data, isLoading, refetch } = query
  const record = data?.data

  const authProviders: AuthProvider[] = (record?.authProviders ??
    []) as AuthProvider[]
  const myBikes: MyBike[] = (record?.myBikes ?? []) as MyBike[]
  const currentPlan = record?.currentPlan as
    | 'FREE'
    | 'PREMIUM'
    | null
    | undefined
  const isUser = record?.role === 'USER'
  const userId = record?.id as string | undefined

  const [planHistories, setPlanHistories] = useState<PlanHistory[]>([])
  const [historiesLoading, setHistoriesLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<ChangePlanForm>()
  const [messageApi, contextHolder] = message.useMessage()

  const fetchHistories = async (id: string) => {
    setHistoriesLoading(true)
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken()
      if (!token) return
      const res = await fetch(`/api/admin/users/${id}/plan/histories`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = (await res.json()) as PlanHistory[]
        setPlanHistories(json)
      }
    } finally {
      setHistoriesLoading(false)
    }
  }

  useEffect(() => {
    if (isUser && userId) {
      void fetchHistories(userId)
    }
  }, [isUser, userId])

  const handleChangePlan = async (values: ChangePlanForm) => {
    if (!userId) return
    setSubmitting(true)
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken()
      if (!token) {
        void messageApi.error('認証情報を取得できませんでした')
        return
      }
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: values.plan,
          reason: values.reason || null,
        }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { message?: string }
        void messageApi.error(err.message ?? 'プランの変更に失敗しました')
        return
      }
      void messageApi.success('プランを変更しました')
      setModalOpen(false)
      form.resetFields()
      void refetch()
      void fetchHistories(userId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {contextHolder}
      <Show isLoading={isLoading}>
        <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="ID">
            {record?.id as string}
          </Descriptions.Item>
          <Descriptions.Item label="名前">
            {record?.name as string}
          </Descriptions.Item>
          <Descriptions.Item label="通知メール">
            {(record?.notificationEmail as string) ?? '未設定'}
          </Descriptions.Item>
          <Descriptions.Item label="ステータス">
            <Tag color={statusColor[record?.status as string] ?? 'default'}>
              {record?.status as string}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="ロール">
            <Tag color={roleColor[record?.role as string] ?? 'default'}>
              {record?.role as string}
            </Tag>
          </Descriptions.Item>
          {isUser && (
            <Descriptions.Item label="現在のプラン">
              <Tag color={planColor[currentPlan ?? ''] ?? 'default'}>
                {currentPlan ?? '—'}
              </Tag>
              <Button
                size="small"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  form.setFieldValue('plan', currentPlan ?? 'FREE')
                  setModalOpen(true)
                }}
              >
                プランを変更
              </Button>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="プロフィール公開">
            {record?.isProfilePublic ? '公開' : '非公開'}
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
          <Descriptions.Item label="更新日">
            {record?.updatedAt ? (
              <DateField
                value={record.updatedAt as string}
                format="YYYY/MM/DD HH:mm"
              />
            ) : (
              '—'
            )}
          </Descriptions.Item>
        </Descriptions>

        <Typography.Title level={4} style={{ marginTop: 32 }}>
          認証プロバイダー
        </Typography.Title>
        <Table<AuthProvider>
          dataSource={authProviders}
          rowKey="externalId"
          pagination={false}
          style={{ marginBottom: 32 }}
        >
          <Table.Column
            title="プロバイダー"
            dataIndex="providerType"
            render={(v: string) => <Tag>{providerLabel[v] ?? v}</Tag>}
          />
          <Table.Column title="外部ID" dataIndex="externalId" />
          <Table.Column
            title="有効"
            dataIndex="isActive"
            render={(v: boolean) => (
              <Tag color={v ? 'green' : 'default'}>{v ? '有効' : '無効'}</Tag>
            )}
          />
        </Table>

        <Typography.Title level={4}>所有バイク一覧</Typography.Title>
        <Table<MyBike>
          dataSource={myBikes}
          rowKey="id"
          pagination={false}
          scroll={{ x: true }}
          style={{ marginBottom: 32 }}
        >
          <Table.Column
            title="ニックネーム"
            render={(_: unknown, row: MyBike) => (
              <Link href={`/my-bikes/${row.id}`}>{row.nickname ?? '—'}</Link>
            )}
          />
          <Table.Column
            title="メーカー"
            render={(_: unknown, row: MyBike) =>
              row.userBike.bike?.manufacturer.name ?? '—'
            }
          />
          <Table.Column
            title="モデル名"
            render={(_: unknown, row: MyBike) =>
              row.userBike.bike?.modelName ?? '—'
            }
          />
          <Table.Column
            title="年式"
            render={(_: unknown, row: MyBike) =>
              row.userBike.bike?.modelYear ?? '—'
            }
          />
          <Table.Column
            title="総走行距離 (km)"
            render={(_: unknown, row: MyBike) =>
              row.userBike.totalMileage != null
                ? row.userBike.totalMileage.toLocaleString()
                : '—'
            }
          />
          <Table.Column
            title="ステータス"
            dataIndex="ownStatus"
            render={(v: string) => (
              <Tag color={ownStatusColor[v] ?? 'default'}>{v}</Tag>
            )}
          />
          <Table.Column
            title="所有開始日"
            dataIndex="ownedAt"
            render={(v: string | null) =>
              v ? <DateField value={v} format="YYYY/MM/DD" /> : '—'
            }
          />
          <Table.Column
            title="売却日"
            dataIndex="soldAt"
            render={(v: string | null) =>
              v ? <DateField value={v} format="YYYY/MM/DD" /> : '—'
            }
          />
        </Table>

        {isUser && (
          <>
            <Typography.Title level={4}>プラン変更履歴</Typography.Title>
            <Table<PlanHistory>
              dataSource={planHistories}
              rowKey="id"
              pagination={false}
              loading={historiesLoading}
            >
              <Table.Column
                title="変更日時"
                dataIndex="changedAt"
                render={(v: string) => (
                  <DateField value={v} format="YYYY/MM/DD HH:mm" />
                )}
              />
              <Table.Column
                title="プラン"
                dataIndex="plan"
                render={(v: string) => (
                  <Tag color={planColor[v] ?? 'default'}>{v}</Tag>
                )}
              />
              <Table.Column title="変更者" dataIndex="changedByName" />
              <Table.Column
                title="理由"
                dataIndex="reason"
                render={(v: string | null) => v ?? '—'}
              />
            </Table>
          </>
        )}
      </Show>

      <Modal
        title="プランを変更"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText="変更"
        cancelText="キャンセル"
        confirmLoading={submitting}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => void handleChangePlan(values)}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="新しいプラン"
            name="plan"
            rules={[{ required: true, message: 'プランを選択してください' }]}
          >
            <Select
              options={[
                { value: 'FREE', label: 'FREE' },
                { value: 'PREMIUM', label: 'PREMIUM' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="変更理由（任意）"
            name="reason"
            rules={[{ max: 200, message: '200文字以内で入力してください' }]}
          >
            <Input.TextArea rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
