'use client'

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'

export interface TouringFormData {
  title: string
  startDate: string
  endDate: string
  startMileage: string
  endMileage: string
}

export interface TouringFormProps {
  initialData?: TouringFormData
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
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = getTodayDateString()
  const [formData, setFormData] = useState<TouringFormData>({
    title: '',
    startDate: today ?? '',
    endDate: today ?? '',
    startMileage: '',
    endMileage: '',
  })
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const validateForm = (): boolean => {
    setValidationError('')

    // 日付の前後関係をチェック
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (start > end) {
        setValidationError('開始日は終了日より前である必要があります')
        return false
      }
    }

    // 走行距離の大小関係をチェック
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

    if (!validateForm()) {
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
            setFormData((prev) => ({
              ...prev,
              title: e.target.value,
            }))
          }
          maxLength={100}
          required
          disabled={isSubmitting}
          placeholder="例: 北海道ツーリング"
        />
      </FormField>

      <FormField label="開始日" htmlFor="startDate" required>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              startDate: e.target.value,
            }))
          }
          required
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="終了日" htmlFor="endDate" required>
        <Input
          id="endDate"
          type="date"
          value={formData.endDate}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              endDate: e.target.value,
            }))
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
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              startMileage: e.target.value,
            }))
          }}
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
          onChange={(e) => {
            setFormData((prev) => ({
              ...prev,
              endMileage: e.target.value,
            }))
          }}
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
