'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AccountLimitsValue } from '@repo/shared-domain'
import type { UserPlan } from '@repo/shared-types'
import { getTodayDateString } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { DateInput } from '@repo/ui/dateInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { InfoBox } from './InfoBox'
import { apiGet } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * バイク登録台数の上限案内文言を、ロール・プラン・プラン取得状態に応じて返す
 *
 * @remarks
 * プラン取得中にプレミアムユーザーへ誤って無料プランの上限を表示しないよう、
 * ローディング中は台数を含まない案内文言を返す。
 * 文言そのものは `AccountLimitsValue.limitMessage('bike')` を唯一の出所にする
 * （実際に上限超過で登録APIが返すエラーメッセージと同じ生成元）。以前は
 * このファイルで「ゲストアカウントでは」「無料プランでは」のように文言を
 * 個別に持っていたため、サーバー側のメッセージ（「ゲストアカウントは」
 * 「無料ユーザーは」）と表現が揃っていなかった。
 */
const getBikeLimitText = (params: {
  isGuest: boolean
  isProfileLoading: boolean
  plan: UserPlan | null | undefined
}): string => {
  const { isGuest, isProfileLoading, plan } = params

  if (isGuest) {
    return AccountLimitsValue.from('GUEST', null).limitMessage('bike')
  }
  if (isProfileLoading) {
    return '登録可能な台数を確認しています…'
  }
  return AccountLimitsValue.from('USER', plan ?? null).limitMessage('bike')
}

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
  const { isGuest } = useAuth()
  const { data: profile, isLoading: isProfileLoading } = useSWR(
    isGuest ? null : '/api/v1/user/profile',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )
  const bikeLimitText = getBikeLimitText({
    isGuest,
    isProfileLoading,
    plan: profile?.plan,
  })

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

      <InfoBox variant="info" style={{ marginTop: 'var(--spacing-4)' }}>
        {bikeLimitText}
      </InfoBox>

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
              inputMode="numeric"
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

        <FormField label="ニックネーム" htmlFor="nickname" required>
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
            required
            disabled={isSubmitting}
            placeholder="バイクの愛称"
          />
        </FormField>

        <FormField label="購入日" htmlFor="purchaseDate">
          <DateInput
            id="purchaseDate"
            value={formData.purchaseDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                purchaseDate: e.target.value,
              }))
            }
            max={getTodayDateString()}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="購入価格" htmlFor="purchasePrice">
          <Input
            id="purchasePrice"
            type="number"
            inputMode="numeric"
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
            inputMode="numeric"
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
            inputMode="numeric"
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
