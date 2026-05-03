'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { EditIcon } from '@/components/icons/EditIcon'
import { apiGet, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

export function ProfileCard() {
  // SWRによるデータフェッチ
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/user/profile',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  // ローカル状態（編集用）
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editNotificationEmail, setEditNotificationEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // 編集モードの開始
  const handleEdit = () => {
    setEditName(data?.name || '')
    setEditNotificationEmail(data?.notificationEmail || '')
    setIsEditing(true)
    setUpdateError(null)
  }

  // 編集のキャンセル
  const handleCancel = () => {
    setIsEditing(false)
    setEditName('')
    setEditNotificationEmail('')
    setUpdateError(null)
  }

  // プロフィール更新
  const handleSave = async () => {
    if (!editName.trim()) {
      setUpdateError('名前を入力してください')
      return
    }

    setIsSaving(true)
    setUpdateError(null)

    try {
      const response = await apiPost('/api/v1/user/profile', {
        name: editName.trim(),
        notificationEmail: editNotificationEmail.trim() || null,
      })

      // SWRキャッシュを更新
      await mutate(response.data)

      setIsEditing(false)
      setEditName('')
    } catch (err) {
      if (err instanceof ApiV1Error) {
        setUpdateError(err.message)
      } else {
        setUpdateError('プロフィールの更新に失敗しました')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ローディング状態
  if (isLoading) {
    return (
      <BaseCard title="プロフィール">
        <div>読み込み中...</div>
      </BaseCard>
    )
  }

  // エラー状態
  if (error) {
    const errorMessage =
      error instanceof ApiV1Error
        ? error.message
        : 'プロフィールの取得に失敗しました'

    return (
      <BaseCard title="プロフィール">
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <Button onClick={() => mutate()}>再試行</Button>
      </BaseCard>
    )
  }

  // 編集モード
  if (isEditing) {
    return (
      <BaseCard title="プロフィール編集">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          className="flex flex-col"
        >
          <FormField
            label="ユーザー名"
            htmlFor="profile-name"
            required
            error={updateError || undefined}
          >
            <Input
              id="profile-name"
              type="text"
              placeholder="名前を入力"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              error={!!updateError}
              disabled={isSaving}
              autoComplete="name"
              maxLength={50}
            />
          </FormField>

          <FormField
            label="通知メールアドレス"
            htmlFor="profile-notification-email"
          >
            <Input
              id="profile-notification-email"
              type="email"
              placeholder="通知用メールアドレスを入力"
              value={editNotificationEmail}
              onChange={(e) => setEditNotificationEmail(e.target.value)}
              disabled={isSaving}
              autoComplete="email"
            />
          </FormField>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              variant="danger"
              disabled={isSaving}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </BaseCard>
    )
  }

  // 表示モード
  return (
    <BaseCard
      title="プロフィール"
      headerAction={
        <Button
          onClick={handleEdit}
          variant="cloud"
          size="sm"
          aria-label="プロフィールを編集"
        >
          <EditIcon />
        </Button>
      }
    >
      <div>
        <p>名前: {data?.name || '未設定'}</p>
        <p>通知メールアドレス: {data?.notificationEmail || '未設定'}</p>
      </div>
    </BaseCard>
  )
}
