'use client'

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { ToggleSection } from '@repo/ui/toggleSection'

export interface FuelLogFormData {
  refueledAt: string
  mileage: string
  previousMileage: string
  amount: string
  totalPrice: string
  memo: string
  updateTotalMileage: boolean
}

export interface FuelLogFormProps {
  initialData?: FuelLogFormData
  onSubmit: (data: FuelLogFormData) => Promise<void>
  isSubmitting: boolean
  error: string
  isEdit?: boolean
  totalMileage?: number
}

export const FuelLogForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false,
  totalMileage,
}: FuelLogFormProps) => {
  const [formData, setFormData] = useState<FuelLogFormData>({
    refueledAt: '',
    mileage: '',
    previousMileage: '',
    amount: '',
    totalPrice: '',
    memo: '',
    updateTotalMileage: true,
  })
  const [isUpdateTotalMileageManual, setIsUpdateTotalMileageManual] =
    useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  // 登録モード: totalMileageを初期値として設定
  useEffect(() => {
    if (!isEdit && totalMileage !== undefined) {
      setFormData((prev) => ({
        ...prev,
        mileage: totalMileage.toString(),
        previousMileage: totalMileage.toString(),
        updateTotalMileage: false,
      }))
      setIsUpdateTotalMileageManual(false)
    }
  }, [isEdit, totalMileage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const today = new Date().toISOString().split('T')[0]
  const isUpdateTotalMileageDisabled =
    totalMileage !== undefined &&
    formData.mileage !== '' &&
    Number(formData.mileage) <= totalMileage

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
      }}
    >
      <FormField label="給油日時" htmlFor="refueledAt" required>
        <Input
          id="refueledAt"
          type="date"
          value={formData.refueledAt}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              refueledAt: e.target.value,
            }))
          }
          max={today}
          required
          disabled={isSubmitting}
        />
      </FormField>

      <FormField label="給油時走行距離 (km)" htmlFor="mileage" required>
        <Input
          id="mileage"
          type="number"
          value={formData.mileage}
          onChange={(e) => {
            const newMileage = e.target.value
            const isDisabled =
              totalMileage !== undefined &&
              newMileage !== '' &&
              Number(newMileage) <= totalMileage
            setFormData((prev) => ({
              ...prev,
              mileage: newMileage,
              updateTotalMileage: isDisabled
                ? false
                : isUpdateTotalMileageManual
                  ? prev.updateTotalMileage
                  : true,
            }))
            if (isDisabled) {
              setIsUpdateTotalMileageManual(false)
            }
          }}
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 5000"
        />
      </FormField>

      <ToggleSection
        title={`前回の走行距離: ${formData.previousMileage.toLocaleString()} km（自動設定）`}
        defaultOpen={false}
      >
        <FormField
          label="前回の給油時走行距離 (km)"
          htmlFor="previousMileage"
          required
        >
          <Input
            id="previousMileage"
            type="number"
            value={formData.previousMileage}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                previousMileage: e.target.value,
              }))
            }}
            min="0"
            step="1"
            required
            disabled={isSubmitting}
            placeholder="例: 4800"
          />
        </FormField>
      </ToggleSection>

      <FormField label="給油量 (L)" htmlFor="amount" required>
        <Input
          id="amount"
          type="number"
          value={formData.amount}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              amount: e.target.value,
            }))
          }
          min="0.01"
          step="0.01"
          required
          disabled={isSubmitting}
          placeholder="例: 10.5"
        />
      </FormField>

      <FormField label="給油価格 (円)" htmlFor="totalPrice" required>
        <Input
          id="totalPrice"
          type="number"
          value={formData.totalPrice}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              totalPrice: e.target.value,
            }))
          }
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 2000"
        />
      </FormField>

      <FormField label="メモ" htmlFor="memo" helperText="最大500文字">
        <Input
          id="memo"
          type="text"
          value={formData.memo}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              memo: e.target.value,
            }))
          }
          maxLength={500}
          disabled={isSubmitting}
          placeholder="例: ハイオク満タン"
        />
      </FormField>

      {!isEdit && totalMileage !== undefined && (
        <FormField label="" htmlFor="updateTotalMileage">
          <Checkbox
            id="updateTotalMileage"
            label="総走行距離を更新する"
            checked={formData.updateTotalMileage}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                updateTotalMileage: e.target.checked,
              }))
              setIsUpdateTotalMileageManual(true)
            }}
            disabled={isSubmitting || isUpdateTotalMileageDisabled}
          />
        </FormField>
      )}

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
