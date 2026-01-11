'use client'

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'

export interface FuelLogFormData {
  refueledAt: string
  mileage: string
  previousMileage: string
  amount: string
  totalPrice: string
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
    updateTotalMileage: true,
  })

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
      }))
    }
  }, [isEdit, totalMileage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const today = new Date().toISOString().split('T')[0]

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
            setFormData((prev) => ({
              ...prev,
              mileage: newMileage,
              // 総走行距離以下になったら自動的にチェックを外す
              updateTotalMileage:
                totalMileage !== undefined && Number(newMileage) <= totalMileage
                  ? false
                  : prev.updateTotalMileage,
            }))
          }}
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 5000"
        />
      </FormField>

      <FormField
        label="前回給油時走行距離 (km)"
        htmlFor="previousMileage"
        required
      >
        <Input
          id="previousMileage"
          type="number"
          value={formData.previousMileage}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              previousMileage: e.target.value,
            }))
          }
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 4800"
        />
      </FormField>

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
            disabled={
              isSubmitting ||
              (formData.mileage !== '' &&
                Number(formData.mileage) <= totalMileage)
            }
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
