'use client'

import { CopyOutlined } from '@ant-design/icons'
import { DateField, useTable } from '@refinedev/antd'
import type { BaseRecord } from '@refinedev/core'
import { useCustomMutation, useInvalidate } from '@refinedev/core'
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import { useState } from 'react'

type SystemApiKeyRow = BaseRecord & {
  name: string
  prefix: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export default function SystemApiKeyListPage() {
  const { message } = App.useApp()
  const { tableProps, searchFormProps } = useTable<SystemApiKeyRow>({
    syncWithLocation: true,
    resource: 'system-api-keys',
    sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
  })

  const invalidate = useInvalidate()
  const refresh = () =>
    invalidate({ resource: 'system-api-keys', invalidates: ['list'] })

  const { mutate: generate, mutation: generateMutation } = useCustomMutation()
  const isGenerating = generateMutation.isPending
  const { mutate: toggleActive } = useCustomMutation()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm<{ name: string }>()
  const [generatedFullKey, setGeneratedFullKey] = useState<string | null>(null)

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    generate(
      {
        url: '/api/admin/system-api-keys',
        method: 'post',
        values,
      },
      {
        onSuccess: (result) => {
          setIsCreateModalOpen(false)
          createForm.resetFields()
          setGeneratedFullKey(result.data['fullKey'] as string)
          refresh()
        },
      }
    )
  }

  const handleToggleActive = (record: SystemApiKeyRow) => {
    toggleActive(
      {
        url: `/api/admin/system-api-keys/${record.id}`,
        method: 'patch',
        values: { isActive: !record.isActive },
      },
      { onSuccess: refresh }
    )
  }

  const handleCopy = async () => {
    if (!generatedFullKey) return
    await navigator.clipboard.writeText(generatedFullKey)
    message.success('コピーしました')
  }

  return (
    <>
      <Form form={searchFormProps.form}>{null}</Form>

      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          ＋ 新規発行
        </Button>
      </div>

      <Table<SystemApiKeyRow> {...tableProps} rowKey="id">
        <Table.Column dataIndex="name" title="名前" />
        <Table.Column
          dataIndex="prefix"
          title="プレフィックス"
          render={(v: string) => (
            <Typography.Text code>{v}_****</Typography.Text>
          )}
        />
        <Table.Column
          dataIndex="isActive"
          title="状態"
          width={100}
          render={(v: boolean) =>
            v ? <Tag color="green">有効</Tag> : <Tag color="red">失効済み</Tag>
          }
        />
        <Table.Column
          dataIndex="lastUsedAt"
          title="最終利用"
          width={170}
          render={(v: string | null) =>
            v ? <DateField value={v} format="YYYY/MM/DD HH:mm" /> : '—'
          }
        />
        <Table.Column
          dataIndex="createdAt"
          title="発行日"
          width={170}
          render={(v: string) => (
            <DateField value={v} format="YYYY/MM/DD HH:mm" />
          )}
        />
        <Table.Column
          title="操作"
          width={120}
          render={(_: unknown, record: SystemApiKeyRow) => (
            <Space>
              <Button
                size="small"
                danger={record.isActive}
                onClick={() => handleToggleActive(record)}
              >
                {record.isActive ? '失効させる' : '再有効化'}
              </Button>
            </Space>
          )}
        />
      </Table>

      <Modal
        title="新規システムAPIキー発行"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false)
          createForm.resetFields()
        }}
        onOk={handleCreate}
        confirmLoading={isGenerating}
        okText="発行する"
        cancelText="キャンセル"
      >
        <Typography.Paragraph type="secondary">
          キーの用途がわかる名前をつけてください（例: purge-quit-users batch）
        </Typography.Paragraph>
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="キー名"
            rules={[
              { required: true, message: 'キー名を入力してください' },
              { max: 50, message: '50文字以内で入力してください' },
            ]}
          >
            <Input placeholder="例: GitHub Actions purge batch" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="システムAPIキーを発行しました"
        open={generatedFullKey !== null}
        onCancel={() => setGeneratedFullKey(null)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopy}>
            クリップボードにコピー
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => setGeneratedFullKey(null)}
          >
            閉じる
          </Button>,
        ]}
      >
        <Typography.Paragraph type="danger">
          このキーは今後二度と表示されません。必ずコピーして保管してください。
        </Typography.Paragraph>
        <Typography.Text code copyable={false}>
          {generatedFullKey}
        </Typography.Text>
      </Modal>
    </>
  )
}
