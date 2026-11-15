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
 * 通知メールアドレス確認カード
 *
 * @remarks
 * 確認メールに記載されたURL（`?token=`）からアクセスされる。
 * メールクライアントのリンク先読み込みで確認が完了しないよう、ボタン押下で確認する。
 */
export function VerifyNotificationEmailCard() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!token) return
    setLoading(true)
    setError(null)

    try {
      const response = await apiPostPublic(
        '/api/v1/user/notification-email/verify',
        { token }
      )
      setVerifiedEmail(response.data.notificationEmail)
    } catch (err) {
      setError(
        err instanceof ApiV1Error
          ? err.message
          : '確認に失敗しました。もう一度お試しください。'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <BaseCard title="通知メールアドレスの確認">
        <ErrorMessage>
          確認用のURLが正しくありません。メール本文のリンクからアクセスしてください。
        </ErrorMessage>
      </BaseCard>
    )
  }

  if (verifiedEmail) {
    return (
      <BaseCard
        title="通知メールアドレスの確認"
        footer={
          <p>
            <Link href="/app/profile">プロフィールへ</Link>
          </p>
        }
      >
        <p className="text-sm" role="status">
          通知メールアドレスを {verifiedEmail} に設定しました。
        </p>
      </BaseCard>
    )
  }

  return (
    <BaseCard title="通知メールアドレスの確認">
      {error && (
        <div className="pb-2">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}
      <p className="text-sm pb-4">
        このメールアドレスをMotoRecoの通知メールアドレスに設定します。よろしければ下のボタンを押してください。
      </p>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleVerify}
      >
        確認する
      </Button>
    </BaseCard>
  )
}
