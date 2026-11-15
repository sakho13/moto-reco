'use client'

import { Suspense } from 'react'
import authLayoutStyles from '../(auth)/layout.module.css'
import { VerifyNotificationEmailCard } from '@/components/VerifyNotificationEmailCard'

/**
 * 通知メールアドレス確認ページ
 *
 * @remarks
 * 確認メールのURL（`?token=`）からアクセスする公開ページ。
 * ログイン中・未ログインのどちらでも開けるよう `(auth)` ルートグループの外に配置し、
 * 見た目のみ `(auth)` レイアウトのスタイルを再利用する。
 */
export default function VerifyNotificationEmailPage() {
  return (
    <div className={authLayoutStyles.authLayout}>
      <div className={authLayoutStyles.authContainer}>
        <Suspense fallback={<div className="p-4">読み込み中...</div>}>
          <VerifyNotificationEmailCard />
        </Suspense>
      </div>
    </div>
  )
}
