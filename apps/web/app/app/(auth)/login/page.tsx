'use client'

import { Suspense } from 'react'
import { LoginCard } from '@/components/LoginCard'

/**
 * ログインページ
 *
 * @remarks
 * メール/パスワードログインとGoogleログインをサポート。
 * 新しいUIコンポーネントとデザイントークンを使用。
 * `LoginCard` が `redirect` クエリパラメータ取得に `useSearchParams` を使用するため、
 * Next.jsの要件に従い `Suspense` で囲む。
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4">読み込み中...</div>}>
      <LoginCard />
    </Suspense>
  )
}
