'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type {
  ApiResponseAdminAnnouncementList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

type Announcement = ApiResponseAdminAnnouncementList['announcements'][number]

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '下書き',
  PUBLISHED: '公開中',
  EXPIRED: '失効済み',
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT: styles.statusDraft,
  PUBLISHED: styles.statusPublished,
  EXPIRED: styles.statusExpired,
}

function AdminAnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await authenticatedFetch('/api/v1/admin/announcements')
      if (res.status === 403) {
        setError('管理者権限が必要です')
        return
      }
      const json =
        (await res.json()) as SuccessResponse<ApiResponseAdminAnnouncementList>
      setAnnouncements(json.data.announcements)
    } catch {
      setError('取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish(id: string) {
    await authenticatedFetch(`/api/v1/admin/announcements/${id}/publish`, {
      method: 'POST',
    })
    await load()
  }

  async function handleExpire(id: string) {
    await authenticatedFetch(`/api/v1/admin/announcements/${id}/expire`, {
      method: 'POST',
    })
    await load()
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>システムアナウンス管理</h1>
        <Button onClick={() => router.push('/app/admin/announcements/new')}>
          新規作成
        </Button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <BaseCard title="">
        {loading && <p className={styles.empty}>読み込み中...</p>}
        {!loading && announcements.length === 0 && (
          <p className={styles.empty}>アナウンスはありません</p>
        )}
        {!loading &&
          announcements.map((a) => (
            <div key={a.announcementId} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowHeader}>
                  <span
                    className={`${styles.status} ${STATUS_CLASS[a.status] ?? ''}`}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                  <span className={styles.rowTitle}>{a.title}</span>
                </div>
                <p className={styles.rowBody}>{a.body}</p>
                <p className={styles.rowMeta}>
                  既読数: {a.readCount} ｜ 作成日:{' '}
                  {new Date(a.createdAt).toLocaleDateString('ja-JP')}
                  {a.publishedAt &&
                    ` ｜ 公開日: ${new Date(a.publishedAt).toLocaleDateString('ja-JP')}`}
                </p>
              </div>
              <div className={styles.rowActions}>
                {a.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    onClick={() => handlePublish(a.announcementId)}
                  >
                    公開
                  </Button>
                )}
                {a.status === 'PUBLISHED' && (
                  <Button
                    size="sm"
                    variant="cloud"
                    onClick={() => handleExpire(a.announcementId)}
                  >
                    失効
                  </Button>
                )}
              </div>
            </div>
          ))}
      </BaseCard>
    </div>
  )
}

export default withAuth(AdminAnnouncementsPage)
