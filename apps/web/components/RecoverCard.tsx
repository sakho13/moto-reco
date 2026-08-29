'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ApiV1Error } from '@repo/shared-domain'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { apiPostPublic } from '@/lib/api/client'

/**
 * アカウント復帰カード
 *
 * @remarks
 * 退会案内メールに記載されたURL（`?token=`）からアクセスされる。
 * Firebase再認証は不要で、トークンのみで復帰処理が完結する。
 */
export function RecoverCard() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRecover = async () => {
    if (!token) return
    setLoading(true)
    setError(null)

    try {
      await apiPostPublic('/api/v1/user/auth/recover', { token })
      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof ApiV1Error
          ? err.message
          : '復帰処理に失敗しました。もう一度お試しください。'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <BaseCard title="アカウント復帰">
        <ErrorMessage>
          復帰用のURLが正しくありません。メール本文のリンクからアクセスしてください。
        </ErrorMessage>
      </BaseCard>
    )
  }

  if (success) {
    return (
      <BaseCard
        title="アカウント復帰"
        footer={
          <p>
            <Link href="/app/login">ログイン画面へ</Link>
          </p>
        }
      >
        <p className="text-sm" role="status">
          アカウントを復帰しました。再度ログインしてご利用ください。
        </p>
      </BaseCard>
    )
  }

  return (
    <BaseCard title="アカウント復帰">
      {error && (
        <div className="pb-2">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}
      <p className="text-sm pb-4">
        退会したアカウントを復帰します。よろしければ下のボタンを押してください。
      </p>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleRecover}
      >
        復帰する
      </Button>
    </BaseCard>
  )
}
