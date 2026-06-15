'use client'

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { getNowLocalDateTimeString } from '@/lib/utils/dateUtils'

export interface TouringFormData {
  title: string
  startDateTime: string // "YYYY-MM-DDTHH:mm"
  endDateTime: string // "YYYY-MM-DDTHH:mm"
  startMileage: string
  endMileage: string
}

export interface TouringFormProps {
  initialData?: Partial<TouringFormData>
  onSubmit: (data: TouringFormData) => Promise<void>
  isSubmitting: boolean
  error: string
  isEdit?: boolean
}

export const TouringForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false,
}: TouringFormProps) => {
  const [formData, setFormData] = useState<TouringFormData>(() => ({
    title: initialData?.title ?? '',
    startDateTime: initialData?.startDateTime ?? getNowLocalDateTimeString(),
    endDateTime: initialData?.endDateTime ?? getNowLocalDateTimeString(),
    startMileage: initialData?.startMileage ?? '',
    endMileage: initialData?.endMileage ?? '',
  }))
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title ?? '',
        startDateTime: initialData.startDateTime ?? getNowLocalDateTimeString(),
        endDateTime: initialData.endDateTime ?? getNowLocalDateTimeString(),
        startMileage: initialData.startMileage ?? '',
        endMileage: initialData.endMileage ?? '',
      })
    }
  }, [initialData])

  const validateForm = (): boolean => {
    setValidationError('')

    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime)
      const end = new Date(formData.endDateTime)
      if (start > end) {
        setValidationError('開始日時は終了日時より前である必要があります')
        return false
      }
    }

    if (formData.startMileage && formData.endMileage) {
      const start = Number(formData.startMileage)
      const end = Number(formData.endMileage)
      if (start > end) {
        setValidationError(
          '開始時走行距離は終了時走行距離より小さい必要があります'
        )
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    if (!validateForm()) return
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
          placeholder="例: 北海道ツーリング"
        />
      </FormField>

      <FormField label="開始日時" htmlFor="startDateTime" required>
        <DateTimeInput
          id="startDateTime"
          value={formData.startDateTime}
          minuteStep={1}
          onChange={(e) => {
            const newStart = e.target.value
            setFormData((prev) => ({
              ...prev,
              startDateTime: newStart,
              endDateTime:
                prev.endDateTime && newStart > prev.endDateTime
                  ? newStart
                  : prev.endDateTime,
            }))
          }}
          required
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="終了日時" htmlFor="endDateTime" required>
        <DateTimeInput
          id="endDateTime"
          value={formData.endDateTime}
          minuteStep={1}
          min={formData.startDateTime}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, endDateTime: e.target.value }))
          }
          required
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="開始時走行距離 (km)" htmlFor="startMileage" required>
        <Input
          id="startMileage"
          type="number"
          inputMode="numeric"
          value={formData.startMileage}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, startMileage: e.target.value }))
          }
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 5000"
        />
      </FormField>

      <FormField label="終了時走行距離 (km)" htmlFor="endMileage" required>
        <Input
          id="endMileage"
          type="number"
          inputMode="numeric"
          value={formData.endMileage}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, endMileage: e.target.value }))
          }
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 5500"
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
        {isSubmitting
          ? isEdit
            ? '更新中...'
            : '登録中...'
          : isEdit
            ? '更新する'
            : '登録する'}
      </Button>
    </form>
  )
}
