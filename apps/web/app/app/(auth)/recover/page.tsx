'use client'

import { Suspense } from 'react'
import { RecoverCard } from '@/components/RecoverCard'

/**
 * アカウント復帰ページ
 *
 * @remarks
 * 退会案内メールのURL（`?token=`）からアクセスする公開ページ。
 * `withAuth` でラップしない（非認証ページ）。
 */
export default function RecoverPage() {
  return (
    <Suspense fallback={<div className="p-4">読み込み中...</div>}>
      <RecoverCard />
    </Suspense>
  )
}
