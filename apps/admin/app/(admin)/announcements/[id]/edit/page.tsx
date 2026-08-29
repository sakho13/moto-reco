'use client'

import { Edit, useForm } from '@refinedev/antd'
import { Alert, Form, Input, Select } from 'antd'

export default function AnnouncementEditPage() {
  const { formProps, saveButtonProps, query } = useForm()
  const record = query?.data?.data
  const isEditable = !record || record.status === 'DRAFT'

  return (
    <Edit saveButtonProps={{ ...saveButtonProps, disabled: !isEditable }}>
      {!isEditable && (
        <Alert
          type="warning"
          showIcon
          message="下書き以外のアナウンスは編集できません"
          style={{ marginBottom: 24 }}
        />
      )}
      <Form {...formProps} layout="vertical" disabled={!isEditable}>
        <Form.Item label="種別" name="type" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'システムメンテナンス', value: 'SYSTEM_MAINTENANCE' },
              { label: 'リリースノート', value: 'RELEASE_ANNOUNCEMENT' },
            ]}
          />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.type !== curr.type}
        >
          {({ getFieldValue }) =>
            getFieldValue('type') === 'RELEASE_ANNOUNCEMENT' && (
              <Form.Item
                label="バージョン"
                name="version"
                rules={[
                  { required: true, message: 'バージョンは必須です' },
                  { max: 20, message: '20文字以内で入力してください' },
                ]}
              >
                <Input placeholder="例: 0.0.24" maxLength={20} />
              </Form.Item>
            )
          }
        </Form.Item>
        <Form.Item
          label="タイトル"
          name="title"
          rules={[
            { required: true, message: 'タイトルは必須です' },
            { max: 100, message: '100文字以内で入力してください' },
          ]}
        >
          <Input placeholder="例: 軽微な修正" maxLength={100} />
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
            rows={6}
            placeholder="内容を入力してください"
            maxLength={1000}
          />
        </Form.Item>
      </Form>
    </Edit>
  )
}
