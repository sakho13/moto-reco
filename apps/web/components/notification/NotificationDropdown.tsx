'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type {
  ApiResponseAnnouncementList,
  ApiResponseNotificationList,
  SuccessResponse,
} from '@repo/shared-types'
import styles from './NotificationDropdown.module.css'
import { authenticatedFetch } from '@/lib/api/client'

type NotificationItem = {
  id: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
  kind: 'notification' | 'announcement'
}

type Props = {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(
    null
  )

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

        const notifItems: NotificationItem[] = notifJson.data.notifications.map(
          (n) => ({
            id: n.notificationId,
            title: n.title,
            body: n.body,
            isRead: n.isRead,
            createdAt: n.createdAt,
            kind: 'notification',
          })
        )

        const announceItems: NotificationItem[] =
          announceJson.data.announcements.map((a) => ({
            id: a.announcementId,
            title: a.title,
            body: a.body,
            isRead: a.isRead,
            createdAt: a.publishedAt,
            kind: 'announcement',
          }))

        const merged = [...notifItems, ...announceItems]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)

        setItems(merged)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      const endpoint =
        item.kind === 'notification'
          ? `/api/v1/notifications/${item.id}/read`
          : `/api/v1/announcements/${item.id}/read`
      await authenticatedFetch(endpoint, { method: 'PATCH' })
      setItems((prev) =>
        prev.map((i) =>
          i.kind === item.kind && i.id === item.id ? { ...i, isRead: true } : i
        )
      )
    }
    setSelectedItem({ ...item, isRead: true })
  }

  async function handleMarkAllRead() {
    await Promise.all([
      authenticatedFetch('/api/v1/notifications/read-all', { method: 'PATCH' }),
      authenticatedFetch('/api/v1/announcements/read-all', { method: 'PATCH' }),
    ])
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })))
    onClose()
  }

  function handleViewAll() {
    router.push('/app/notifications')
    onClose()
  }

  return (
    <div className={styles.dropdown} role="dialog" aria-label="通知">
      <div className={styles.header}>
        {selectedItem ? (
          <button
            type="button"
            className={styles.backButton}
            onClick={() => setSelectedItem(null)}
          >
            ← 戻る
          </button>
        ) : (
          <span className={styles.title}>通知</span>
        )}
        {!selectedItem && (
          <button
            type="button"
            className={styles.readAllButton}
            onClick={handleMarkAllRead}
          >
            全既読
          </button>
        )}
      </div>

      {selectedItem ? (
        <div className={styles.detail}>
          <p className={styles.detailTitle}>{selectedItem.title}</p>
          <p className={styles.detailTime}>
            {formatRelativeTime(selectedItem.createdAt)}
          </p>
          <p className={styles.detailBody}>{selectedItem.body}</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
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
                  onClick={() => handleItemClick(item)}
                >
                  <p className={styles.itemTitle}>{item.title}</p>
                  <p className={styles.itemBody}>{item.body}</p>
                  <p className={styles.itemTime}>
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </button>
              ))}
          </div>
          <button
            type="button"
            className={styles.viewAllButton}
            onClick={handleViewAll}
          >
            すべての通知を見る
          </button>
        </>
      )}
    </div>
  )
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  return `${days}日前`
}
