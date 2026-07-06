'use client'

import { Create, useForm, useSelect } from '@refinedev/antd'
import { Form, Input, Select, Switch } from 'antd'
import { GOODS_CATEGORY_OPTIONS } from '@/lib/goodsCategory'

export default function GoodsModelCreatePage() {
  const { formProps, saveButtonProps } = useForm()

  const { selectProps: manufacturerSelectProps } = useSelect({
    resource: 'goods-manufacturers',
    optionLabel: 'name',
    optionValue: 'id',
  })

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="メーカー"
          name="goodsManufacturerId"
          rules={[{ required: true }]}
        >
          <Select {...manufacturerSelectProps} placeholder="メーカーを選択" />
        </Form.Item>
        <Form.Item label="商品名" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="型番" name="modelNumber" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="カテゴリ"
          name="category"
          rules={[{ required: true }]}
        >
          <Select
            options={
              GOODS_CATEGORY_OPTIONS as unknown as {
                value: string
                label: string
              }[]
            }
            placeholder="カテゴリを選択"
          />
        </Form.Item>
        <Form.Item label="Amazon ASIN" name="amazonAsin">
          <Input placeholder="例: B00XXXXXXXX" />
        </Form.Item>
        <Form.Item label="楽天商品ID" name="rakutenItemId">
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
