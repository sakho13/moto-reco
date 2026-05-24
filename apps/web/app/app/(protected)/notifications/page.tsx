'use client'

import { useEffect, useState } from 'react'
import type {
  ApiResponseAnnouncementList,
  ApiResponseNotificationList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import styles from './page.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useNotificationUnreadCount } from '@/lib/hooks/useNotifications'

type UnifiedItem = {
  id: string
  kind: 'notification' | 'announcement'
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

function NotificationsPage() {
  const [items, setItems] = useState<UnifiedItem[]>([])
  const [loading, setLoading] = useState(true)
  const { mutate } = useNotificationUnreadCount()

  useEffect(() => {
    async function load() {
      try {
        const [notifRes, announceRes] = await Promise.all([
          authenticatedFetch('/api/v1/notifications?page=1'),
          authenticatedFetch('/api/v1/announcements'),
        ])
        if (!notifRes.ok || !announceRes.ok) return

        const notifJson =
          (await notifRes.json()) as SuccessResponse<ApiResponseNotificationList>
        const announceJson =
          (await announceRes.json()) as SuccessResponse<ApiResponseAnnouncementList>

        const merged: UnifiedItem[] = [
          ...notifJson.data.notifications.map((n) => ({
            id: n.notificationId,
            kind: 'notification' as const,
            title: n.title,
            body: n.body,
            isRead: n.isRead,
            createdAt: n.createdAt,
          })),
          ...announceJson.data.announcements.map((a) => ({
            id: a.announcementId,
            kind: 'announcement' as const,
            title: a.title,
            body: a.body,
            isRead: a.isRead,
            createdAt: a.publishedAt,
          })),
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setItems(merged)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleMarkAllRead() {
    await authenticatedFetch('/api/v1/notifications/read-all', {
      method: 'PATCH',
    })
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })))
    mutate()
  }

  async function handleMarkRead(item: UnifiedItem) {
    if (item.isRead) return
    if (item.kind === 'notification') {
      await authenticatedFetch(`/api/v1/notifications/${item.id}/read`, {
        method: 'PATCH',
      })
    } else {
      await authenticatedFetch(`/api/v1/announcements/${item.id}/read`, {
        method: 'PATCH',
      })
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id && i.kind === item.kind ? { ...i, isRead: true } : i
      )
    )
    mutate()
  }

  const unreadCount = items.filter((i) => !i.isRead).length

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>通知</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            className={styles.readAllBtn}
            onClick={handleMarkAllRead}
          >
            全て既読にする
          </button>
        )}
      </div>

      <BaseCard title="">
        {loading && <p className={styles.empty}>読み込み中...</p>}
        {!loading && items.length === 0 && (
          <p className={styles.empty}>通知はありません</p>
        )}
        {!loading &&
          items.map((item) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              className={`${styles.item} ${item.isRead ? styles.read : styles.unread}`}
              onClick={() => handleMarkRead(item)}
            >
              <div className={styles.itemContent}>
                <p className={styles.itemTitle}>{item.title}</p>
                <p className={styles.itemBody}>{item.body}</p>
                <p className={styles.itemTime}>
                  {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {!item.isRead && (
                <span className={styles.dot} aria-hidden="true" />
              )}
            </button>
          ))}
      </BaseCard>
    </div>
  )
}

export default withAuth(NotificationsPage)
