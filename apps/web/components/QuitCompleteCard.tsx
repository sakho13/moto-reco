'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { useAuth } from '@/lib/hooks/useAuth'
import { SITE_URL } from '@/lib/statics'

/**
 * 退会手続き完了カード
 *
 * @remarks
 * 退会処理直後にリダイレクトされる公開ページ。`?token=` に復帰用トークンを受け取り、
 * 復帰用URLを表示する。サインアウトはこのページのマウント時に行う
 * （account ページ側で行うと withAuth のリダイレクトと競合しログイン画面が優先されるため）。
 */
export function QuitCompleteCard() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { signOut } = useAuth()

  const [copied, setCopied] = useState(false)
  const hasSignedOutRef = useRef(false)

  useEffect(() => {
    if (hasSignedOutRef.current) return
    hasSignedOutRef.current = true
    void signOut()
  }, [signOut])

  if (!token) {
    return (
      <BaseCard title="退会手続き完了">
        <ErrorMessage>
          復帰用のURLが正しくありません。ご登録のメールアドレスに送信された案内メールをご確認ください。
        </ErrorMessage>
      </BaseCard>
    )
  }

  const recoveryUrl = `${SITE_URL}/app/recover?token=${token}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(recoveryUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <BaseCard
      title="退会手続き完了"
      footer={
        <p>
          <Link href="/app/login">ログイン画面へ</Link>
        </p>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          退会手続きが完了しました。ご登録のメールアドレスに復帰用のご案内メールを送信しました。
        </p>
        <p
          className="text-sm"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          30日間は下記の復帰用URL、または案内メール内のリンクから復帰できます。以降は完全に削除され復帰できません。
        </p>
        <div
          style={{
            backgroundColor: 'var(--color-muted)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-3)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-xs)',
            wordBreak: 'break-all',
          }}
        >
          {recoveryUrl}
        </div>
        <Button variant="primary" outline fullWidth onClick={handleCopy}>
          {copied ? 'コピーしました ✓' : 'クリップボードにコピー'}
        </Button>
      </div>
    </BaseCard>
  )
}
