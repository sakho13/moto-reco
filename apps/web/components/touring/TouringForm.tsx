'use client'

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import {
  getNowLocalDateTimeString,
  getTodayAtTime,
} from '@/lib/utils/dateUtils'

export type TouringMode = 'history' | 'plan'

export interface TouringFormData {
  title: string
  startDateTime: string // "YYYY-MM-DDTHH:mm"
  endDateTime: string // "YYYY-MM-DDTHH:mm"
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
  disablePlanMode?: boolean
}

const getDefaultStartDateTime = (m: TouringMode) =>
  m === 'plan' ? getTodayAtTime('09:00') : getNowLocalDateTimeString()

const getDefaultEndDateTime = (m: TouringMode) =>
  m === 'plan' ? getTodayAtTime('17:00') : getNowLocalDateTimeString()

export const TouringForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false,
  hideModeSelector = false,
  disablePlanMode = false,
}: TouringFormProps) => {
  const [mode, setMode] = useState<TouringMode>(initialData?.mode ?? 'history')
  const [formData, setFormData] = useState<Omit<TouringFormData, 'mode'>>(
    () => {
      const initialMode = initialData?.mode ?? 'history'
      return {
        title: initialData?.title ?? '',
        startDateTime:
          initialData?.startDateTime ?? getDefaultStartDateTime(initialMode),
        endDateTime:
          initialData?.endDateTime ?? getDefaultEndDateTime(initialMode),
        startMileage: initialData?.startMileage ?? '',
        endMileage: initialData?.endMileage ?? '',
      }
    }
  )
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (initialData) {
      const updatedMode = initialData.mode ?? mode
      setFormData({
        title: initialData.title ?? '',
        startDateTime:
          initialData.startDateTime ?? getDefaultStartDateTime(updatedMode),
        endDateTime:
          initialData.endDateTime ?? getDefaultEndDateTime(updatedMode),
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

    if (!isPlan && formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime)
      const end = new Date(formData.endDateTime)
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
    await onSubmit({
      ...formData,
      // プランの場合、終了日時は開始日時と同じ（スポット追加で自動更新される）
      endDateTime: isPlan ? formData.startDateTime : formData.endDateTime,
      mode,
    })
  }

  // プランは5分刻み、履歴は1分刻み
  const minuteStep = isPlan ? 5 : 1

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
            onClick={() => !disablePlanMode && setMode('plan')}
            disabled={isSubmitting || disablePlanMode}
            title={
              disablePlanMode
                ? 'ゲストアカウントはプランを作成できません'
                : undefined
            }
            style={{
              flex: 1,
              padding: 'var(--spacing-2)',
              background:
                mode === 'plan' ? 'var(--color-product)' : 'var(--color-cloud)',
              color: disablePlanMode
                ? 'var(--color-muted-foreground)'
                : mode === 'plan'
                  ? 'white'
                  : 'var(--color-ink)',
              border: 'none',
              borderLeft: '1px solid var(--color-cloudHover)',
              cursor:
                isSubmitting || disablePlanMode ? 'not-allowed' : 'pointer',
              fontWeight:
                mode === 'plan'
                  ? 'var(--font-weight-semibold)'
                  : 'var(--font-weight-normal)',
              fontSize: 'var(--font-size-sm)',
              opacity: disablePlanMode ? 0.5 : 1,
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
        htmlFor="startDateTime"
        required
      >
        <DateTimeInput
          id="startDateTime"
          value={formData.startDateTime}
          minuteStep={minuteStep}
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

      {!isPlan && (
        <FormField label="終了日時" htmlFor="endDateTime" required>
          <DateTimeInput
            id="endDateTime"
            value={formData.endDateTime}
            minuteStep={minuteStep}
            min={formData.startDateTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endDateTime: e.target.value }))
            }
            required
            disabled={isSubmitting}
          />
        </FormField>
      )}

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
