'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * 退会手続き完了カード
 *
 * @remarks
 * 退会処理直後に遷移する公開ページ。復帰用URLは案内メールでのみ届け、画面やURLには表示しない
 * （復帰用トークンは無認証でアカウントを復帰できるため、ブラウザ履歴などに残さない）。
 * サインアウトはこのページのマウント時に行う
 * （account ページ側で行うと withAuth のリダイレクトと競合しログイン画面が優先されるため）。
 */
export function QuitCompleteCard() {
  const { signOut } = useAuth()
  const hasSignedOutRef = useRef(false)

  useEffect(() => {
    if (hasSignedOutRef.current) return
    hasSignedOutRef.current = true
    void signOut()
  }, [signOut])

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
        <p className="text-sm" style={{ color: 'var(--color-inkLight)' }}>
          30日間は案内メール内のリンクから復帰できます。以降は完全に削除され復帰できません。
        </p>
      </div>
    </BaseCard>
  )
}
