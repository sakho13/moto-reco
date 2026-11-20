'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ETC_DEVICE_TYPE_LABELS,
  ETC_DEVICE_TYPES,
  type EtcDeviceType,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { DateInput } from '@repo/ui/dateInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { Select, type SelectOption } from '@repo/ui/select'
import { InfoBox } from './InfoBox'
import styles from './MyBikeEditForm.module.css'
import { ETC_ARTICLE_PATH } from '@/lib/statics'

/** ETC車載器の選択肢（空文字は未設定） */
const ETC_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: '未設定' },
  ...ETC_DEVICE_TYPES.map((type) => ({
    value: type,
    label: ETC_DEVICE_TYPE_LABELS[type],
  })),
]

export interface MyBikeEditFormData {
  nickname: string
  purchaseDate: string
  totalMileage: string
  displacement: string
  /** ETC車載器の搭載状況（空文字は未設定） */
  etcType: EtcDeviceType | ''
}

export interface MyBikeEditFormProps {
  initialData: MyBikeEditFormData
  isDisplacementEditable: boolean
  onSubmit: (data: MyBikeEditFormData) => Promise<void>
  isSubmitting: boolean
  error: string
}

export const MyBikeEditForm = ({
  initialData,
  isDisplacementEditable,
  onSubmit,
  isSubmitting,
  error,
}: MyBikeEditFormProps) => {
  const [formData, setFormData] = useState<MyBikeEditFormData>(initialData)

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {!isDisplacementEditable && (
        <InfoBox variant="warning">
          登録済みモデルのため、排気量は編集できません。
        </InfoBox>
      )}

      <FormField label="ニックネーム" htmlFor="nickname" required>
        <Input
          id="nickname"
          type="text"
          value={formData.nickname}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, nickname: e.target.value }))
          }
          maxLength={50}
          required
          disabled={isSubmitting}
          placeholder="バイクの愛称"
        />
      </FormField>

      <FormField label="総走行距離 (km)" htmlFor="totalMileage" required>
        <Input
          id="totalMileage"
          type="number"
          inputMode="numeric"
          value={formData.totalMileage}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, totalMileage: e.target.value }))
          }
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="km"
        />
      </FormField>

      <FormField label="購入日" htmlFor="purchaseDate">
        <DateInput
          id="purchaseDate"
          value={formData.purchaseDate}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))
          }
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="ETC車載器" htmlFor="etcType">
        <Select
          id="etcType"
          options={ETC_TYPE_OPTIONS}
          value={formData.etcType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              etcType: e.target.value as EtcDeviceType | '',
            }))
          }
          disabled={isSubmitting}
        />
        <Link
          href={ETC_ARTICLE_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.etcLink}
        >
          ETCとETC2.0の違い・メリットを見る
        </Link>
      </FormField>

      <FormField label="排気量 (cc)" htmlFor="displacement" required>
        <Input
          id="displacement"
          type="number"
          inputMode="numeric"
          value={formData.displacement}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, displacement: e.target.value }))
          }
          min="1"
          step="1"
          required
          disabled={isSubmitting || !isDisplacementEditable}
          placeholder="例: 400"
        />
      </FormField>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Button
        type="submit"
        disabled={isSubmitting}
        fullWidth
        loading={isSubmitting}
      >
        {isSubmitting ? '更新中...' : '更新する'}
      </Button>
    </form>
  )
}
