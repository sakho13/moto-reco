'use client'

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'

export type TouringMode = 'history' | 'plan'

export interface TouringFormData {
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  startMileage: string
  endMileage: string
  mode: TouringMode
}

export interface TouringFormProps {
  initialData?: Partial<TouringFormData>
  onSubmit: (data: TouringFormData) => Promise<void>
  isSubmitting: boolean
  error: string
  isEdit?: boolean
  hideModeSelector?: boolean
}

export const TouringForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false,
  hideModeSelector = false,
}: TouringFormProps) => {
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = getTodayDateString()

  const [mode, setMode] = useState<TouringMode>(initialData?.mode ?? 'history')
  const [formData, setFormData] = useState<Omit<TouringFormData, 'mode'>>({
    title: initialData?.title ?? '',
    startDate: initialData?.startDate ?? today,
    startTime: initialData?.startTime ?? '00:00',
    endDate: initialData?.endDate ?? today,
    endTime: initialData?.endTime ?? '00:00',
    startMileage: initialData?.startMileage ?? '',
    endMileage: initialData?.endMileage ?? '',
  })
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title ?? '',
        startDate: initialData.startDate ?? today,
        startTime: initialData.startTime ?? '00:00',
        endDate: initialData.endDate ?? today,
        endTime: initialData.endTime ?? '00:00',
        startMileage: initialData.startMileage ?? '',
        endMileage: initialData.endMileage ?? '',
      })
      if (initialData.mode) {
        setMode(initialData.mode)
      }
    }
  }, [initialData]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPlan = mode === 'plan'

  const validateForm = (): boolean => {
    setValidationError('')

    if (formData.startDate && formData.endDate) {
      const start = new Date(
        `${formData.startDate}T${formData.startTime || '00:00'}`
      )
      const end = new Date(`${formData.endDate}T${formData.endTime || '00:00'}`)
      if (start > end) {
        setValidationError(
          isPlan
            ? '出発予定日時は帰着予定日時より前である必要があります'
            : '開始日時は終了日時より前である必要があります'
        )
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
    await onSubmit({ ...formData, mode })
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
      {/* モード切り替え */}
      {!hideModeSelector && !isEdit && (
        <div
          style={{
            display: 'flex',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('history')}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: 'var(--spacing-2)',
              background:
                mode === 'history'
                  ? 'var(--color-product)'
                  : 'var(--color-cloud)',
              color: mode === 'history' ? 'white' : 'var(--color-ink)',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight:
                mode === 'history'
                  ? 'var(--font-weight-semibold)'
                  : 'var(--font-weight-normal)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            ツーリングを記録
          </button>
          <button
            type="button"
            onClick={() => setMode('plan')}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: 'var(--spacing-2)',
              background:
                mode === 'plan' ? 'var(--color-product)' : 'var(--color-cloud)',
              color: mode === 'plan' ? 'white' : 'var(--color-ink)',
              border: 'none',
              borderLeft: '1px solid var(--color-cloudHover)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight:
                mode === 'plan'
                  ? 'var(--font-weight-semibold)'
                  : 'var(--font-weight-normal)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            プランを作成
          </button>
        </div>
      )}

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
          placeholder={
            isPlan ? '例: 夏の北海道ツーリング' : '例: 北海道ツーリング'
          }
        />
      </FormField>

      <FormField
        label={isPlan ? '出発予定日時' : '開始日時'}
        htmlFor="startDate"
        required
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              const newStart = e.target.value
              setFormData((prev) => ({
                ...prev,
                startDate: newStart,
                endDate:
                  prev.endDate && newStart > prev.endDate
                    ? newStart
                    : prev.endDate,
              }))
            }}
            required
            disabled={isSubmitting}
          />
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startTime: e.target.value }))
            }
            disabled={isSubmitting}
            style={{ width: '9rem', flexShrink: 0 }}
          />
        </div>
      </FormField>

      <FormField
        label={isPlan ? '帰着予定日時' : '終了日時'}
        htmlFor="endDate"
        required
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            min={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endDate: e.target.value }))
            }
            required
            disabled={isSubmitting}
          />
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endTime: e.target.value }))
            }
            disabled={isSubmitting}
            style={{ width: '9rem', flexShrink: 0 }}
          />
        </div>
      </FormField>

      <FormField
        label={isPlan ? '出発時走行距離 (km)（任意）' : '開始時走行距離 (km)'}
        htmlFor="startMileage"
        required={!isPlan}
      >
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
          required={!isPlan}
          disabled={isSubmitting}
          placeholder="例: 5000"
        />
      </FormField>

      {!isPlan && (
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
      )}

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
            : isPlan
              ? '保存中...'
              : '登録中...'
          : isEdit
            ? '更新する'
            : isPlan
              ? 'プランを保存'
              : '登録する'}
      </Button>
    </form>
  )
}
