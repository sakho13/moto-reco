'use client'

import { Edit, useForm } from '@refinedev/antd'
import { Checkbox, Form, Input, Switch } from 'antd'
import { COMPANY_CATEGORY_OPTIONS } from '@/lib/companyCategory'

export default function CompanyEditPage() {
  const { formProps, saveButtonProps } = useForm()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="会社名" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="英語名" name="nameEn">
          <Input />
        </Form.Item>
        <Form.Item
          label="区分"
          name="categories"
          rules={[{ required: true, message: '区分を選択してください' }]}
        >
          <Checkbox.Group options={[...COMPANY_CATEGORY_OPTIONS]} />
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
        <Form.Item label="有効" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  )
}
