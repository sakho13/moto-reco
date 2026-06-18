import useSWR from 'swr'
import { apiGet } from '@/lib/api/client'

/** ユーザーのプロフィールで設定されたタイムゾーンを返す。未設定の場合はブラウザのタイムゾーンを返す。 */
export function useUserTimezone(): string {
  const { data } = useSWR('/api/v1/user/profile', async (url) => {
    const response = await apiGet(url)
    return response.data
  })
  return data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}
