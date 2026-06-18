'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { Select } from '@repo/ui/select'
import { ModalBase } from '@/components/common/ModalBase'
import { apiPatch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

const TIMEZONE_LIST: string[] =
  typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
    ? (
        Intl as { supportedValuesOf: (key: string) => string[] }
      ).supportedValuesOf('timeZone')
    : ['Asia/Tokyo', 'America/New_York', 'Europe/London', 'UTC']

const TIMEZONE_OPTIONS = [
  { value: '', label: '未設定' },
  ...TIMEZONE_LIST.map((tz) => ({ value: tz, label: tz })),
]

interface ProfileEditModalProps {
  initialName: string
  initialNotificationEmail: string | null
  initialIsProfilePublic: boolean
  initialTimezone: string | null
  isGuest?: boolean
  onClose: () => void
  onSuccess: (updated: {
    name: string
    notificationEmail: string | null
    isProfilePublic: boolean
    timezone: string | null
  }) => void
}

export function ProfileEditModal({
  initialName,
  initialNotificationEmail,
  initialIsProfilePublic,
  initialTimezone,
  isGuest = false,
  onClose,
  onSuccess,
}: ProfileEditModalProps) {
  const [name, setName] = useState(initialName)
  const [notificationEmail, setNotificationEmail] = useState(
    initialNotificationEmail ?? ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProfilePublic, setIsProfilePublic] = useState(initialIsProfilePublic)
  const [timezone, setTimezone] = useState(initialTimezone ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('名前を入力してください')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const response = await apiPatch('/api/v1/user/profile', {
        name: trimmedName,
        notificationEmail: notificationEmail.trim() || null,
        isProfilePublic,
        timezone: timezone || null,
      })
      onSuccess({
        name: response.data.name,
        notificationEmail: response.data.notificationEmail,
        isProfilePublic: response.data.isProfilePublic,
        timezone: response.data.timezone,
      })
    } catch (err) {
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
        <FormField label="公開設定" htmlFor="modal-profile-public">
          <Checkbox
            id="modal-profile-public"
            label="プロフィールを公開する"
            checked={isProfilePublic}
            onChange={(e) => setIsProfilePublic(e.target.checked)}
            disabled={isSubmitting || isGuest}
          />
        </FormField>

        <FormField
          label="通知メールアドレス"
          htmlFor="modal-profile-notification-email"
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

        <FormField label="タイムゾーン" htmlFor="modal-profile-timezone">
          <Select
            id="modal-profile-timezone"
            options={TIMEZONE_OPTIONS}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={isSubmitting}
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
