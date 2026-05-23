'use client'

import { Edit, useForm, useSelect } from '@refinedev/antd'
import { Form, Input, InputNumber, Select } from 'antd'

export default function BikeEditPage() {
  const { formProps, saveButtonProps } = useForm()

  const { selectProps: manufacturerSelectProps } = useSelect({
    resource: 'manufacturers',
    optionLabel: 'name',
    optionValue: 'id',
  })

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="メーカー"
          name="manufacturerId"
          rules={[{ required: true }]}
        >
          <Select {...manufacturerSelectProps} placeholder="メーカーを選択" />
        </Form.Item>
        <Form.Item
          label="モデル名"
          name="modelName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="排気量 (cc)"
          name="displacement"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="年式" name="modelYear" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="型式指定番号"
          name="modelCode"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="発売年"
          name="releaseYear"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="発売月"
          name="releaseMonth"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={12} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="ステータス" name="settingStatus">
          <Select
            options={[
              { value: 'INACTIVE', label: 'INACTIVE' },
              { value: 'ACTIVE', label: 'ACTIVE' },
            ]}
          />
        </Form.Item>
      </Form>
    </Edit>
  )
}
