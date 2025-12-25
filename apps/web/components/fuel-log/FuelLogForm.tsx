'use client'

import { useState, useEffect } from 'react'
import { Button } from '@packages/ui/button'
import { ErrorMessage } from '@packages/ui/errorMessage'
import { FormField } from '@packages/ui/formField'
import { Input } from '@packages/ui/input'

export interface FuelLogFormData {
  refueledAt: string
  mileage: string
  amount: string
  totalPrice: string
}

export interface FuelLogFormProps {
  initialData?: FuelLogFormData
  onSubmit: (data: FuelLogFormData) => Promise<void>
  isSubmitting: boolean
  error: string
  isEdit?: boolean
}

export const FuelLogForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false,
}: FuelLogFormProps) => {
  const [formData, setFormData] = useState<FuelLogFormData>({
    refueledAt: '',
    mileage: '',
    amount: '',
    totalPrice: '',
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

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
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              mileage: e.target.value,
            }))
          }
          min="0"
          step="1"
          required
          disabled={isSubmitting}
          placeholder="例: 5000"
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
