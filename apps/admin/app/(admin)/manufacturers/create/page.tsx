'use client'

import { Create, useForm } from '@refinedev/antd'
import { Form, Input, Switch } from 'antd'

export default function ManufacturerCreatePage() {
  const { formProps, saveButtonProps } = useForm()

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="メーカー名" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="英語名" name="nameEn">
          <Input />
        </Form.Item>
        <Form.Item label="国" name="country">
          <Input />
        </Form.Item>
        <Form.Item label="公式サイト URL" name="websiteUrl">
          <Input />
        </Form.Item>
        <Form.Item label="ロゴ URL" name="logoUrl">
          <Input />
        </Form.Item>
        <Form.Item
          label="有効"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Create>
  )
}
