'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ApiV1Error } from '@repo/shared-domain'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import authLayoutStyles from '../../(auth)/layout.module.css'
import { apiPost } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { APP_NAME } from '@/lib/statics'

// Firebase認証状態を使用するため、動的レンダリングを強制
export const dynamic = 'force-dynamic'

/**
 * OAuth同意画面の本体
 *
 * @remarks
 * MCPクライアント（Claude.ai / ChatGPT等）からの認可リクエストに対し、
 * ログイン中ユーザーがアクセス許可を判断するページ。
 * 未ログインの場合はログインページへ誘導し、ログイン後にこのページへ戻ってくる。
 */
function OAuthAuthorizeContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const clientId = searchParams.get('client_id') ?? ''
  const redirectUri = searchParams.get('redirect_uri') ?? ''
  const codeChallenge = searchParams.get('code_challenge') ?? ''
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? ''
  const responseType = searchParams.get('response_type') ?? ''
  const state = searchParams.get('state') ?? undefined
  const scope = searchParams.get('scope') ?? undefined

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isValidRequest =
    clientId.length > 0 &&
    redirectUri.length > 0 &&
    codeChallenge.length > 0 &&
    responseType === 'code'

  useEffect(() => {
    if (loading) return
    if (!user) {
      const currentUrl = `/app/oauth/authorize?${searchParams.toString()}`
      router.replace(`/app/login?redirect=${encodeURIComponent(currentUrl)}`)
    }
  }, [loading, user, router, searchParams])

  const handleDecision = async (decision: 'approve' | 'deny') => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiPost('/api/v1/mcp/oauth/authorize', {
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
        state,
        scope,
        decision,
      })
      window.location.href = res.data.redirectUrl
    } catch (err) {
      setError(
        err instanceof ApiV1Error
          ? err.message
          : '認可処理に失敗しました。もう一度お試しください。'
      )
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return (
      <BaseCard title="読み込み中...">
        <p>認証状態を確認しています。</p>
      </BaseCard>
    )
  }

  if (!isValidRequest) {
    return (
      <BaseCard title="認可リクエストが不正です">
        <ErrorMessage>
          必要なパラメータが不足しています。連携元のアプリからやり直してください。
        </ErrorMessage>
      </BaseCard>
    )
  }

  return (
    <BaseCard title="外部アプリからの連携リクエスト">
      <p>
        外部アプリ（client_id: <code>{clientId}</code>）が {APP_NAME}{' '}
        のデータへのアクセスを要求しています。
      </p>
      <p>許可すると、承認後に以下のURLへリダイレクトされます。</p>
      <p style={{ wordBreak: 'break-all' }}>{redirectUri}</p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-3)',
          marginTop: 'var(--spacing-4)',
        }}
      >
        <Button
          variant="primary"
          loading={submitting}
          onClick={() => handleDecision('approve')}
        >
          許可する
        </Button>
        <Button
          variant="primary"
          outline
          disabled={submitting}
          onClick={() => handleDecision('deny')}
        >
          拒否する
        </Button>
      </div>
    </BaseCard>
  )
}

/**
 * OAuth同意画面
 *
 * @remarks
 * `OAuthAuthorizeContent` が `useSearchParams` を使用するため、
 * Next.jsの要件に従い `Suspense` で囲む。
 * レイアウトは `(auth)` ルートグループのスタイルパターン（中央寄せカード）を再利用する。
 */
export default function OAuthAuthorizePage() {
  return (
    <div className={authLayoutStyles.authLayout}>
      <div className={authLayoutStyles.authContainer}>
        <Suspense fallback={<div className="p-4">読み込み中...</div>}>
          <OAuthAuthorizeContent />
        </Suspense>
      </div>
    </div>
  )
}
