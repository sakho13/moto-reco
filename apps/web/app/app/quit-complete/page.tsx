'use client'

import { Suspense } from 'react'
import authLayoutStyles from '../(auth)/layout.module.css'
import { QuitCompleteCard } from '@/components/QuitCompleteCard'

/**
 * 退会手続き完了ページ
 *
 * @remarks
 * 退会実行・サインアウト後に遷移する公開ページ（`?token=`）。
 * `withAuth` でラップしない（サインアウト直後にアクセスされるため非認証ページとする）。
 * 認証状態によるガードを持たないよう `(auth)` ルートグループの外に配置し、
 * 見た目のみ `(auth)` レイアウトのスタイルを再利用する。
 */
export default function QuitCompletePage() {
  return (
    <div className={authLayoutStyles.authLayout}>
      <div className={authLayoutStyles.authContainer}>
        <Suspense fallback={<div className="p-4">読み込み中...</div>}>
          <QuitCompleteCard />
        </Suspense>
      </div>
    </div>
  )
}
