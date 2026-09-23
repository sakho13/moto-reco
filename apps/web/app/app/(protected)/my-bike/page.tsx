'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { withAuth } from '@/lib/hoc/withAuth'
import { useActiveBike } from '@/lib/hooks/useActiveBike'

/**
 * 愛車（マイバイク）のエントリーポイント
 *
 * @remarks
 * 「マイバイク」一覧は中継ページ化していた（Issue #575「02 所見」）ため廃止し、
 * アクティブ車両の詳細（`/app/my-bike/{id}`）へ直接送る。複数台の切り替えは
 * ヘッダーの `BikeSwitcher` に任せ、一覧はここでは再実装しない。
 * `/app/my-bike/{id}` というURL自体はE2E・既存リンクが使うため維持する。
 */
function Page() {
  const router = useRouter()
  const { activeBikeId, bikes, isLoading, error } = useActiveBike()

  useEffect(() => {
    if (!isLoading && activeBikeId) {
      router.replace(`/app/my-bike/${activeBikeId}`)
    }
  }, [isLoading, activeBikeId, router])

  if (!isLoading && error) {
    return (
      <div className={styles.page}>
        <p className={styles.centerMessage}>バイク情報の取得に失敗しました</p>
      </div>
    )
  }

  if (!isLoading && bikes.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>まだバイクが登録されていません</p>
          <Button onClick={() => router.push('/app/bike/register')} size="sm">
            最初のバイクを登録
          </Button>
        </div>
      </div>
    )
  }

  // ロード中、またはアクティブ車両決定後のリダイレクト待ち
  return (
    <div className={styles.page}>
      <p className={styles.centerMessage}>読み込み中...</p>
    </div>
  )
}

export default withAuth(Page)
