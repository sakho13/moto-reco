'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type { ApiResponseTouringPlanDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import styles from './PlanEditModal.module.css'
import { ModalBase } from '@/components/common/ModalBase'
import { trackEvent } from '@/lib/analytics'
import { apiDelete, apiPatch } from '@/lib/api/client'

interface PlanEditModalProps {
  bikeId: string
  planId: string
  plan: ApiResponseTouringPlanDetail
  onClose: () => void
  onSuccess: (action: 'update' | 'delete') => void
}

/**
 * ツーリングプランのタイトルの編集および削除を行うモーダル
 */
export function PlanEditModal({
  bikeId,
  planId,
  plan,
  onClose,
  onSuccess,
}: PlanEditModalProps) {
  const [title, setTitle] = useState(plan.title)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState('')

  const detailUrl =
    `/api/v1/user-bike/bike/${bikeId}/touring-plans/${planId}` as `/api/v1/user-bike/bike/${string}/touring-plans/${string}`
  const listUrl =
    `/api/v1/user-bike/bike/${bikeId}/touring-plans` as `/api/v1/user-bike/bike/${string}/touring-plans`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      await apiPatch(detailUrl, { title })
      trackEvent('touring_plan_update', { title_changed: title !== plan.title })
      await Promise.all([mutate(detailUrl), mutate(listUrl)]).catch(() => {})
      toast.success('更新しました')
      onSuccess('update')
    } catch (err) {
      trackEvent('touring_plan_error', {
        operation: 'update',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiDelete(detailUrl)
      trackEvent('touring_plan_delete', {
        linked_touring_count: plan.touringIds?.length ?? 0,
      })
      await mutate(listUrl).catch(() => {})
      toast.success('プランを削除しました')
      onSuccess('delete')
    } catch (err) {
      trackEvent('touring_plan_error', {
        operation: 'delete',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
      toast.error(
        err instanceof ApiV1Error ? err.message : '削除に失敗しました'
      )
      setConfirmingDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ModalBase title="プランを編集" onClose={onClose}>
      <div className={styles.body}>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <FormField label="タイトル" htmlFor="planEditTitle" required>
            <Input
              id="planEditTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
              disabled={isSubmitting}
            />
          </FormField>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button
            type="submit"
            disabled={isSubmitting}
            fullWidth
            loading={isSubmitting}
          >
            更新する
          </Button>
        </form>

        <hr className={styles.divider} />

        {confirmingDelete ? (
          <div className={styles.confirm}>
            <p className={styles.confirmText}>
              このプランを削除しますか？この操作は取り消せません。
            </p>
            <div className={styles.confirmActions}>
              <Button
                onClick={() => setConfirmingDelete(false)}
                variant="cloud"
                size="sm"
                disabled={isDeleting}
                fullWidth
              >
                キャンセル
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                size="sm"
                disabled={isDeleting}
                loading={isDeleting}
                fullWidth
              >
                {isDeleting ? '削除中...' : '削除する'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setConfirmingDelete(true)}
            variant="danger"
            size="sm"
            disabled={isSubmitting}
          >
            削除
          </Button>
        )}
      </div>
    </ModalBase>
  )
}
