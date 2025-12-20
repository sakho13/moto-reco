'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BaseCard } from '@packages/ui/baseCard'
import { Button } from '@packages/ui/button'
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
  const [isSaving, setIsSaving] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // 編集モードの開始
  const handleEdit = () => {
    setEditName(data?.name || '')
    setIsEditing(true)
    setUpdateError(null)
  }

  // 編集のキャンセル
  const handleCancel = () => {
    setIsEditing(false)
    setEditName('')
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
        <div style={{ color: 'red' }}>
          <p>エラー: {errorMessage}</p>
          <Button onClick={() => mutate()}>再試行</Button>
        </div>
      </BaseCard>
    )
  }

  // 編集モード
  if (isEditing) {
    return (
      <BaseCard title="プロフィール編集">
        <div>
          <div>
            <label htmlFor="name">名前:</label>
            <input
              id="name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={50}
              style={{ marginLeft: '8px' }}
            />
          </div>

          {updateError && (
            <div style={{ color: 'red', marginTop: '8px' }}>{updateError}</div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
            <Button onClick={handleCancel} variant="danger" disabled={isSaving}>
              キャンセル
            </Button>
          </div>
        </div>
      </BaseCard>
    )
  }

  // 表示モード
  return (
    <BaseCard title="プロフィール">
      <div>
        <p>名前: {data?.name || '未設定'}</p>
        <Button onClick={handleEdit} style={{ marginTop: '8px' }}>
          編集
        </Button>
      </div>
    </BaseCard>
  )
}
