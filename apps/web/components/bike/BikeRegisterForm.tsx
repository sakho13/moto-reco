'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { InfoBox } from './InfoBox'

export interface BikeFormData {
  nickname: string
  purchaseDate: string
  purchasePrice: string
  purchaseMileage: string
  totalMileage: string
  displacement: string
}

export interface BikeRegisterFormProps {
  selectedBike: {
    modelName: string
    displacement: number
    modelYear: number
  } | null
  onSubmit: (data: BikeFormData) => Promise<void>
  isSubmitting: boolean
  error: string
}

export const BikeRegisterForm = ({
  selectedBike,
  onSubmit,
  isSubmitting,
  error,
}: BikeRegisterFormProps) => {
  const [formData, setFormData] = useState<BikeFormData>({
    nickname: '',
    purchaseDate: '',
    purchasePrice: '',
    purchaseMileage: '',
    totalMileage: '',
    displacement: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <>
      <h2
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--spacing-4)',
          color: 'var(--color-ink)',
        }}
      >
        ステップ3: 登録情報を入力
      </h2>

      {selectedBike ? (
        <InfoBox variant="info">
          <p
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            選択したバイク: {selectedBike.modelName}
          </p>
          <p>
            {selectedBike.displacement}cc / {selectedBike.modelYear}年式
          </p>
        </InfoBox>
      ) : (
        <InfoBox>
          <p
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-1)',
            }}
          >
            モデル未選択
          </p>
          <p>排気量を手動で入力してください</p>
        </InfoBox>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
        }}
      >
        {!selectedBike && (
          <FormField label="排気量 (cc)" htmlFor="displacement" required>
            <Input
              id="displacement"
              type="number"
              value={formData.displacement}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  displacement: e.target.value,
                }))
              }
              min="1"
              step="1"
              required
              placeholder="例: 400"
              disabled={isSubmitting}
            />
          </FormField>
        )}

        <FormField label="ニックネーム" htmlFor="nickname">
          <Input
            id="nickname"
            type="text"
            value={formData.nickname}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                nickname: e.target.value,
              }))
            }
            maxLength={50}
            disabled={isSubmitting}
            placeholder="バイクの愛称（任意）"
          />
        </FormField>

        <FormField label="購入日" htmlFor="purchaseDate">
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                purchaseDate: e.target.value,
              }))
            }
            max={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="購入価格" htmlFor="purchasePrice">
          <Input
            id="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                purchasePrice: e.target.value,
              }))
            }
            min="0"
            step="1"
            disabled={isSubmitting}
            placeholder="円"
          />
        </FormField>

        <FormField label="購入時走行距離" htmlFor="purchaseMileage">
          <Input
            id="purchaseMileage"
            type="number"
            value={formData.purchaseMileage}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                purchaseMileage: e.target.value,
              }))
            }
            min="0"
            step="1"
            disabled={isSubmitting}
            placeholder="km"
          />
        </FormField>

        <FormField label="現在の走行距離" htmlFor="totalMileage" required>
          <Input
            id="totalMileage"
            type="number"
            value={formData.totalMileage}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                totalMileage: e.target.value,
              }))
            }
            min="0"
            step="1"
            required
            disabled={isSubmitting}
            placeholder="km"
          />
        </FormField>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button
          type="submit"
          disabled={isSubmitting}
          fullWidth
          loading={isSubmitting}
        >
          {isSubmitting ? '登録中...' : '登録する'}
        </Button>
      </form>
    </>
  )
}
