'use client'

import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type { ApiResponseUserGoodsDetail } from '@repo/shared-types'
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
import { apiDelete, apiGet, apiPatch } from '@/lib/api/client'

export interface GoodsEditModalProps {
  goods: ApiResponseUserGoodsDetail
  onClose: () => void
  onSuccess: (action: 'update' | 'delete') => void
}

type EditFormData = {
  purchasedAt: string
  price: string
  userMyBikeId: string
  memo: string
}

const toDateInputValue = (date: string | null): string => {
  if (!date) return ''
  return date.slice(0, 10)
}

/**
 * 登録済みグッズの購入情報（マイバイク紐付け・購入日・価格・メモ）を編集するモーダル
 */
export function GoodsEditModal({
  goods,
  onClose,
  onSuccess,
}: GoodsEditModalProps) {
  const [formData, setFormData] = useState<EditFormData>({
    purchasedAt: toDateInputValue(goods.purchasedAt),
    price: goods.price !== null ? String(goods.price) : '',
    userMyBikeId: goods.userMyBikeId ?? '',
    memo: goods.memo ?? '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const { data: bikesData, isLoading: isBikesLoading } = useSWR(
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
      await apiPatch(`/api/v1/user-goods/${goods.userGoodsId}`, {
        userMyBikeId: formData.userMyBikeId || null,
        purchasedAt: formData.purchasedAt
          ? new Date(formData.purchasedAt)
          : null,
        price: formData.price ? Number(formData.price) : null,
        memo: memo.length > 0 ? memo : null,
      })

      toast.success('グッズを更新しました')
      onSuccess('update')
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      'このグッズを削除しますか？この操作は取り消せません。'
    )
    if (!isConfirmed) return

    setError('')
    setIsDeleting(true)

    try {
      await apiDelete(`/api/v1/user-goods/${goods.userGoodsId}`)
      toast.success('グッズを削除しました')
      onSuccess('delete')
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ModalBase title="購入情報を編集" onClose={onClose}>
      <div className={styles.modelInfo}>
        <p className={styles.modelName}>
          {goods.manufacturerName} {goods.modelName}
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
            disabled={isSubmitting || isBikesLoading}
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
          disabled={isSubmitting || isDeleting || isBikesLoading}
          fullWidth
          loading={isSubmitting}
        >
          {isSubmitting
            ? '更新中...'
            : isBikesLoading
              ? 'バイク情報を読み込み中...'
              : '更新する'}
        </Button>
      </form>

      <Button
        type="button"
        onClick={handleDelete}
        disabled={isSubmitting || isDeleting}
        variant="danger"
        fullWidth
        loading={isDeleting}
        style={{ marginTop: 'var(--spacing-2)' }}
      >
        削除する
      </Button>
    </ModalBase>
  )
}
