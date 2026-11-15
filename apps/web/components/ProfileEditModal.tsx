'use client'

import { useState } from 'react'
import { ApiV1Error } from '@repo/shared-domain'
import { Button } from '@repo/ui/button'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { ModalBase } from '@/components/common/ModalBase'
import { trackEvent } from '@/lib/analytics'
import { apiPatch } from '@/lib/api/client'

interface ProfileEditModalProps {
  initialName: string
  initialNotificationEmail: string | null
  /** 所有確認待ちの通知メールアドレス（ある場合はメール欄の初期値にする） */
  pendingNotificationEmail?: string | null
  isGuest?: boolean
  onClose: () => void
  onSuccess: (updated: {
    name: string
    notificationEmail: string | null
    pendingNotificationEmail: string | null
  }) => void
}

export function ProfileEditModal({
  initialName,
  initialNotificationEmail,
  pendingNotificationEmail = null,
  isGuest = false,
  onClose,
  onSuccess,
}: ProfileEditModalProps) {
  const [name, setName] = useState(initialName)
  // 確認待ちがあればそれを、なければ確定済みのアドレスをメール欄の初期値にする
  const initialEmailInput = pendingNotificationEmail ?? initialNotificationEmail
  const [notificationEmail, setNotificationEmail] = useState(
    initialEmailInput ?? ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('名前を入力してください')
      return
    }

    // メール欄を変更していなければ送らない（名前だけの保存で確認待ちの依頼を取り消さないため）
    const requestedEmail = notificationEmail.trim() || null
    const isEmailChanged = requestedEmail !== initialEmailInput

    setIsSubmitting(true)
    setError(null)
    try {
      const response = await apiPatch('/api/v1/user/profile', {
        name: trimmedName,
        ...(isEmailChanged ? { notificationEmail: requestedEmail } : {}),
      })
      trackEvent('profile_update', {
        changed_name: trimmedName !== initialName,
        changed_notification_email: isEmailChanged,
        is_guest: isGuest,
      })
      onSuccess({
        name: response.data.name,
        notificationEmail: response.data.notificationEmail,
        pendingNotificationEmail: response.data.pendingNotificationEmail,
      })
    } catch (err) {
      trackEvent('profile_error', {
        operation: 'update',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
      setError(
        err instanceof ApiV1Error
          ? err.message
          : 'プロフィールの更新に失敗しました'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalBase title="プロフィール編集" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <FormField
          label="ユーザー名"
          htmlFor="modal-profile-name"
          required
          error={error || undefined}
        >
          <Input
            id="modal-profile-name"
            type="text"
            placeholder="名前を入力"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            disabled={isSubmitting}
            autoComplete="name"
            maxLength={50}
            autoFocus
          />
        </FormField>
        <FormField
          label="通知メールアドレス"
          htmlFor="modal-profile-notification-email"
          helperText={
            pendingNotificationEmail
              ? '確認待ちのアドレスです。元のアドレスに戻して保存すると変更を取り消せます'
              : '新しいアドレスに確認メールを送信し、メール内のリンクで確認できたら変更されます'
          }
        >
          <Input
            id="modal-profile-notification-email"
            type="email"
            placeholder="通知用メールアドレスを入力"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            disabled={isSubmitting || isGuest}
            autoComplete="email"
          />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </ModalBase>
  )
}
