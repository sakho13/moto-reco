'use client'

import { Edit, useForm } from '@refinedev/antd'
import { Form, Select } from 'antd'

export default function UserEditPage() {
  const { formProps, saveButtonProps } = useForm()

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="ステータス" name="status">
          <Select
            options={[
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'INACTIVE', label: 'INACTIVE' },
              { value: 'SUSPENDED', label: 'SUSPENDED' },
            ]}
          />
        </Form.Item>
        <Form.Item label="ロール" name="role">
          <Select
            options={[
              { value: 'USER', label: 'USER' },
              { value: 'ADMIN', label: 'ADMIN' },
              { value: 'GUEST', label: 'GUEST' },
            ]}
          />
        </Form.Item>
      </Form>
    </Edit>
  )
}
