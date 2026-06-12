'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import type { ApiResponseTouringPlanDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { DateTimeInput } from '@repo/ui/dateTimeInput'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { toast } from '@repo/ui/sonner'
import { ModalBase } from '@/components/common/ModalBase'
import { apiDelete, apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { toLocalDateTimeString } from '@/lib/utils/dateUtils'

interface PlanEditModalProps {
  bikeId: string
  planId: string
  plan: ApiResponseTouringPlanDetail
  onClose: () => void
  onSuccess: (action: 'update' | 'delete') => void
}

/**
 * ツーリングプランのタイトル・出発予定日時の編集および削除を行うモーダル
 */
export function PlanEditModal({
  bikeId,
  planId,
  plan,
  onClose,
  onSuccess,
}: PlanEditModalProps) {
  const [title, setTitle] = useState(plan.title)
  const [departAt, setDepartAt] = useState(toLocalDateTimeString(plan.departAt))
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
    if (!departAt) {
      setError('出発予定日時を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      await apiPatch(detailUrl, {
        title,
        departAt: new Date(departAt),
      })
      await Promise.all([mutate(detailUrl), mutate(listUrl)])
      toast.success('更新しました')
      onSuccess('update')
    } catch (err) {
      setError(err instanceof ApiV1Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiDelete(detailUrl)
      await mutate(listUrl)
      toast.success('プランを削除しました')
      onSuccess('delete')
    } catch (err) {
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
          }}
        >
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

          <FormField label="出発予定日時" htmlFor="planEditDepartAt" required>
            <DateTimeInput
              id="planEditDepartAt"
              value={departAt}
              minuteStep={5}
              onChange={(e) => setDepartAt(e.target.value)}
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

        <hr style={{ borderColor: 'var(--color-cloud)', margin: '0' }} />

        {confirmingDelete ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-ink)',
              }}
            >
              このプランを削除しますか？この操作は取り消せません。
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
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
