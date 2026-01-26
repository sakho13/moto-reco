'use client'

import { useEffect, useState } from 'react'
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

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const TouringForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false,
}: TouringFormProps) => {
  const today = getTodayDateString()
  const [formData, setFormData] = useState<TouringFormData>({
    title: '',
    startDate: today,
    endDate: today,
    startMileage: '',
    endMileage: '',
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
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
          value={formData.title}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              title: event.target.value,
            }))
          }
          required
          disabled={isSubmitting}
          placeholder="例: 春のツーリング"
        />
      </FormField>

      <FormField label="開始日" htmlFor="startDate" required>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              startDate: event.target.value,
            }))
          }
          required
          disabled={isSubmitting}
          max={today}
        />
      </FormField>

      <FormField label="終了日" htmlFor="endDate" required>
        <Input
          id="endDate"
          type="date"
          value={formData.endDate}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              endDate: event.target.value,
            }))
          }
          required
          disabled={isSubmitting}
          max={today}
        />
      </FormField>

      <FormField label="開始時の総走行距離 (km)" htmlFor="startMileage">
        <Input
          id="startMileage"
          type="number"
          value={formData.startMileage}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              startMileage: event.target.value,
            }))
          }
          min="0"
          step="1"
          disabled={isSubmitting}
          placeholder="例: 12000"
        />
      </FormField>

      <FormField label="終了時の総走行距離 (km)" htmlFor="endMileage">
        <Input
          id="endMileage"
          type="number"
          value={formData.endMileage}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              endMileage: event.target.value,
            }))
          }
          min="0"
          step="1"
          disabled={isSubmitting}
          placeholder="例: 12350"
        />
      </FormField>

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
