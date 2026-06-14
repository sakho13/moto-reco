'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
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
 * タイトルと出発予定日時のみを入力する。出発地・目的地は詳細画面で別途設定する。
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

    if (!formData.departAt) {
      setValidationError('出発予定日時を入力してください')
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

      <FormField label="出発予定日時" htmlFor="departAt" required>
        <DateTimeInput
          id="departAt"
          value={formData.departAt}
          minuteStep={5}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, departAt: e.target.value }))
          }
          required
          disabled={isSubmitting}
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
