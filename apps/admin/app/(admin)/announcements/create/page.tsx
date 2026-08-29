'use client'

import { Create, useForm } from '@refinedev/antd'
import { Form, Input, Select } from 'antd'

export default function AnnouncementCreatePage() {
  const { formProps, saveButtonProps } = useForm({ resource: 'announcements' })

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="種別"
          name="type"
          initialValue="SYSTEM_MAINTENANCE"
          rules={[{ required: true }]}
        >
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
    </Create>
  )
}
