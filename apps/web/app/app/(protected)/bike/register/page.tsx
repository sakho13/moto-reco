'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import {
  BikeRegisterForm,
  type BikeFormData,
} from '@/components/bike/BikeRegisterForm'
import { InfoBox } from '@/components/bike/InfoBox'
import { StepIndicator } from '@/components/bike/StepIndicator'
import { apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

type Step = 1 | 2 | 3

function BikeRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedBike, setSelectedBike] = useState<{
    modelName: string
    displacement: number
    modelYear: number
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFormSubmit = async (formData: BikeFormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const displacement = selectedBike
        ? selectedBike.displacement
        : Number(formData.displacement)

      await apiPost('/api/v1/user-bike/register', {
        bikeId: null,
        displacement: displacement,
        serialNumber: null,
        nickname: formData.nickname || null,
        purchaseDate: formData.purchaseDate || null,
        purchasePrice: formData.purchasePrice
          ? Number(formData.purchasePrice)
          : null,
        purchaseMileage: formData.purchaseMileage
          ? Number(formData.purchaseMileage)
          : null,
        totalMileage: Number(formData.totalMileage) || 0,
      })

      await mutate('/api/v1/user-bike/bikes')
      toast.success('バイクを登録しました', {
        description: 'マイページへ移動します。',
      })
      router.push('/app/home')
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '28rem' }}>
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <Button
          onClick={() => {
            if (step === 1) {
              router.push('/app/home')
            } else if (step === 2) {
              setStep(1)
            } else {
              setStep(2)
            }
          }}
          variant="cloud"
        >
          ← 戻る
        </Button>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--spacing-6)',
          border: '1px solid var(--color-cloud)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-6)',
            color: 'var(--color-ink)',
          }}
        >
          バイク登録
        </h1>

        <StepIndicator currentStep={step} />

        {/* ステップ1: メーカー選択 */}
        {step === 1 && (
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-ink)',
              }}
            >
              ステップ1: メーカーを選択
            </h2>

            <InfoBox variant="info">
              バイクデータベースの準備中のため、現在メーカー選択は利用できません。
              排気量を直接入力する方式でご登録いただけます。
            </InfoBox>

            <Input
              type="text"
              disabled
              placeholder="メーカーを選択してください（現在利用不可）"
            />

            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <Button onClick={() => setStep(2)} variant="cloud" fullWidth>
                次へ
              </Button>
            </div>
          </div>
        )}

        {/* ステップ2: バイク検索 */}
        {step === 2 && (
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-4)',
                color: 'var(--color-ink)',
              }}
            >
              ステップ2: バイクを検索 (現在準備中)
            </h2>

            <InfoBox variant="info">
              バイクデータベースの準備中です。排気量を直接入力してご登録ください。
            </InfoBox>

            <Input
              type="text"
              disabled
              placeholder="例: CB400SF（現在利用不可）"
            />

            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <Button
                onClick={() => {
                  setSelectedBike(null)
                  setStep(3)
                }}
                variant="cloud"
                fullWidth
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {/* ステップ3: 登録情報入力 */}
        {step === 3 && (
          <BikeRegisterForm
            selectedBike={selectedBike}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </div>
    </div>
  )
}

export default withAuth(BikeRegisterPage)
