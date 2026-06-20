'use client'

import { useState, useEffect } from 'react'
import type { MaintenanceType } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DateInput } from '@repo/ui/dateInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { MAINTENANCE_ITEMS_MASTER } from '@/lib/api/server/constants/maintenanceItems'
import { getTodayDateString } from '@repo/shared-utils'

export type MaintenanceLogFormData = {
  performedAt: string
  mileage: string
  memo: string
  selectedItems: MaintenanceType[]
  updateTotalMileage: boolean
}

export type MaintenanceLogFormProps = {
  initialData?: MaintenanceLogFormData
  onSubmit: (data: MaintenanceLogFormData) => Promise<void>
  isSubmitting: boolean
  error: string
  isEdit?: boolean
  totalMileage?: number
}

const CATEGORY_LABELS: Record<string, string> = {
  BRAKE: 'ブレーキ装置',
  ENGINE: 'エンジン',
  TRANSMISSION: '動力伝達装置',
  TIRE: 'タイヤ',
  ELECTRIC: '電気装置',
}

const CATEGORY_ORDER = ['BRAKE', 'ENGINE', 'TRANSMISSION', 'TIRE', 'ELECTRIC']

export const MaintenanceLogForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false,
  totalMileage,
}: MaintenanceLogFormProps) => {
  const today = getTodayDateString()
  const [formData, setFormData] = useState<MaintenanceLogFormData>({
    performedAt: today,
    mileage: totalMileage?.toString() ?? '',
    memo: '',
    selectedItems: [],
    updateTotalMileage: false,
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  useEffect(() => {
    if (!isEdit && totalMileage !== undefined) {
      setFormData((prev) => ({
        ...prev,
        mileage: totalMileage.toString(),
      }))
    }
  }, [isEdit, totalMileage])

  const handleItemToggle = (type: MaintenanceType) => {
    setFormData((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(type)
        ? prev.selectedItems.filter((t) => t !== type)
        : [...prev.selectedItems, type],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const isUpdateTotalMileageDisabled =
    totalMileage !== undefined &&
    formData.mileage !== '' &&
    Number(formData.mileage) <= totalMileage

  const itemsByCategory = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category] ?? category,
    items: MAINTENANCE_ITEMS_MASTER.filter(
      (item) => item.category === category
    ),
  }))

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
      }}
    >
      <FormField label="実施日" htmlFor="performedAt" required>
        <DateInput
          id="performedAt"
          value={formData.performedAt}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, performedAt: e.target.value }))
          }
          max={today}
          required
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="実施時走行距離 (km)" htmlFor="mileage" required>
        <Input
          id="mileage"
          type="number"
          value={formData.mileage}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, mileage: e.target.value }))
          }
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 5000"
        />
      </FormField>

      <FormField label="メモ" htmlFor="memo" helperText="最大500文字">
        <Textarea
          id="memo"
          value={formData.memo}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, memo: e.target.value }))
          }
          maxLength={500}
          disabled={isSubmitting}
          placeholder="例: オイル交換・チェーン注油"
          rows={3}
        />
      </FormField>

      <div>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-2)',
            color: 'var(--color-ink)',
          }}
        >
          メンテナンス項目{' '}
          <span style={{ color: 'var(--color-danger)' }}>*</span>
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
          }}
        >
          {itemsByCategory.map(({ category, label, items }) => (
            <div key={category}>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-ink)',
                  opacity: 0.6,
                  marginBottom: 'var(--spacing-1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 'var(--spacing-1)',
                }}
              >
                {items.map((item) => (
                  <Checkbox
                    key={item.type}
                    id={`item-${item.type}`}
                    label={item.typeName}
                    checked={formData.selectedItems.includes(
                      item.type as MaintenanceType
                    )}
                    onChange={() =>
                      handleItemToggle(item.type as MaintenanceType)
                    }
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isEdit && totalMileage !== undefined && (
        <FormField label="" htmlFor="updateTotalMileage">
          <Checkbox
            id="updateTotalMileage"
            label="総走行距離を更新する"
            checked={formData.updateTotalMileage}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                updateTotalMileage: e.target.checked,
              }))
            }
            disabled={isSubmitting || isUpdateTotalMileageDisabled}
          />
        </FormField>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Button
        type="submit"
        disabled={isSubmitting || formData.selectedItems.length === 0}
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
