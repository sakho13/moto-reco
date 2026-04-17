'use client'

import { useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { InfoBox } from './InfoBox'

export interface MyBikeEditFormData {
  nickname: string
  totalMileage: string
  displacement: string
  isPublic: boolean
}

export interface MyBikeEditFormProps {
  initialData: MyBikeEditFormData
  isDisplacementEditable: boolean
  onSubmit: (data: MyBikeEditFormData) => Promise<void>
  isSubmitting: boolean
  error: string
  isGuest?: boolean
}

export const MyBikeEditForm = ({
  initialData,
  isDisplacementEditable,
  onSubmit,
  isSubmitting,
  error,
  isGuest,
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
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
      }}
    >
      {!isDisplacementEditable && (
        <InfoBox variant="warning">
          登録済みモデルのため、排気量は編集できません。
        </InfoBox>
      )}

      <FormField label="ニックネーム" htmlFor="nickname">
        <Input
          id="nickname"
          type="text"
          value={formData.nickname}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, nickname: e.target.value }))
          }
          maxLength={50}
          disabled={isSubmitting}
          placeholder="バイクの愛称（任意）"
        />
      </FormField>

      <FormField label="総走行距離 (km)" htmlFor="totalMileage" required>
        <Input
          id="totalMileage"
          type="number"
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

      <FormField label="排気量 (cc)" htmlFor="displacement" required>
        <Input
          id="displacement"
          type="number"
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

      <FormField label="公開設定" htmlFor="isPublic">
        <Checkbox
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
          }
          disabled={isSubmitting || (isGuest ?? false)}
          label="このバイクを公開する"
          helperText={
            isGuest
              ? 'ゲストアカウントはバイクを公開できません。'
              : '公開したバイクは、公開ページに情報が掲載されます。'
          }
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
