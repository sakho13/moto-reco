'use client'

import useSWR from 'swr'
import type {
  ApiResponseNotificationUnreadCount,
  SuccessResponse,
} from '@repo/shared-types'
import { authenticatedFetch } from '@/lib/api/client'

async function fetchUnreadCount(): Promise<number> {
  const res = await authenticatedFetch('/api/v1/notifications/unread-count')
  if (!res.ok) return 0
  const json =
    (await res.json()) as SuccessResponse<ApiResponseNotificationUnreadCount>
  return json.data.count
}

/**
 * 未読通知件数を取得するフック
 * 30秒ポーリング + フォーカス時に再取得
 */
export function useNotificationUnreadCount() {
  const { data, mutate } = useSWR(
    '/api/v1/notifications/unread-count',
    fetchUnreadCount,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      fallbackData: 0,
    }
  )
  return { unreadCount: data ?? 0, mutate }
}
