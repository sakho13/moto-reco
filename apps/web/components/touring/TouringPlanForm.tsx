'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { getTodayAtTime } from '@/lib/utils/dateUtils'

export interface TouringPlanFormData {
  title: string
  departAt: string // "YYYY-MM-DDTHH:mm"
}

export interface TouringPlanFormProps {
  onSubmit: (data: TouringPlanFormData) => Promise<void>
  isSubmitting: boolean
  error: string
}

/**
 * ツーリングプラン新規作成フォーム
 *
 * @remarks
 * タイトルのみを入力する。出発予定日時は登録時点では当日09:00で自動設定され、
 * 出発地・目的地と合わせてプラン詳細画面の編集モーダル（`PlanEditModal`）から後で変更できる。
 */
export const TouringPlanForm = ({
  onSubmit,
  isSubmitting,
  error,
}: TouringPlanFormProps) => {
  const [formData, setFormData] = useState<TouringPlanFormData>({
    title: '',
    departAt: getTodayAtTime('09:00'),
  })
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    if (!formData.title.trim()) {
      setValidationError('タイトルを入力してください')
      return
    }

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
      <FormField label="タイトル" htmlFor="title" required>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          maxLength={100}
          required
          disabled={isSubmitting}
          placeholder="例: 夏の北海道ツーリング"
        />
      </FormField>

      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Button
        type="submit"
        disabled={isSubmitting}
        fullWidth
        loading={isSubmitting}
      >
        {isSubmitting ? '作成中...' : 'プランを作成'}
      </Button>
    </form>
  )
}
