'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { getTodayDateString } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { DateInput } from '@repo/ui/dateInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { Select, type SelectOption } from '@repo/ui/select'
import { toast } from '@repo/ui/sonner'
import { Textarea } from '@repo/ui/textarea'
import styles from './GoodsPurchaseModal.module.css'
import { ModalBase } from '@/components/common/ModalBase'
import { apiGet, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

export interface GoodsPurchaseModalModel {
  goodsModelId: string
  manufacturerName: string
  name: string
  modelNumber: string
}

export interface GoodsPurchaseModalProps {
  model: GoodsPurchaseModalModel
  defaultMyUserBikeId?: string
  onClose: () => void
}

type PurchaseFormData = {
  purchasedAt: string
  price: string
  userMyBikeId: string
  memo: string
}

/**
 * グッズカタログから選択した型番の購入情報を入力するモーダル
 *
 * @remarks
 * 登録成功時はトーストを表示した上で `/app/goods` へ遷移する。
 */
export function GoodsPurchaseModal({
  model,
  defaultMyUserBikeId,
  onClose,
}: GoodsPurchaseModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<PurchaseFormData>({
    purchasedAt: getTodayDateString(),
    price: '',
    userMyBikeId: defaultMyUserBikeId ?? '',
    memo: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { data: bikesData } = useSWR(
    '/api/v1/user-bike/bikes',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const bikeOptions: SelectOption[] = [
    { value: '', label: '紐付けなし' },
    ...(bikesData?.bikes ?? []).map((bike) => ({
      value: bike.myUserBikeId,
      label:
        bike.nickname ||
        `${bike.manufacturerName ?? ''} ${bike.modelName ?? ''}`.trim(),
    })),
  ]

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const memo = formData.memo.trim()
      await apiPost('/api/v1/user-goods', {
        goodsModelId: model.goodsModelId,
        userMyBikeId: formData.userMyBikeId || null,
        purchasedAt: formData.purchasedAt
          ? new Date(formData.purchasedAt)
          : null,
        price: formData.price ? Number(formData.price) : null,
        memo: memo.length > 0 ? memo : null,
      })

      toast.success('グッズを登録しました')
      router.push('/app/goods')
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiV1Error ? err.message : 'エラーが発生しました'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalBase title="購入情報を入力" onClose={onClose}>
      <div className={styles.modelInfo}>
        <p className={styles.modelName}>
          {model.manufacturerName} {model.name}（{model.modelNumber}）
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
        }}
      >
        <FormField label="マイバイク" htmlFor="userMyBikeId">
          <Select
            id="userMyBikeId"
            options={bikeOptions}
            value={formData.userMyBikeId}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                userMyBikeId: e.target.value,
              }))
            }
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="購入日" htmlFor="purchasedAt">
          <DateInput
            id="purchasedAt"
            value={formData.purchasedAt}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                purchasedAt: e.target.value,
              }))
            }
            max={getTodayDateString()}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="価格 (円)" htmlFor="price">
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price: e.target.value }))
            }
            min="0"
            step="1"
            disabled={isSubmitting}
            placeholder="例: 15000"
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
            placeholder="例: 誕生日プレゼント"
            rows={3}
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
    </ModalBase>
  )
}
