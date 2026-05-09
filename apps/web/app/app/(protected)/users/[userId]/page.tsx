'use client'

import useSWR from 'swr'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { HistoryItemCard } from '@/components/history/HistoryItemCard'
import { apiGet } from '@/lib/api/client'

interface Props {
  params: { userId: string }
}

export default function UserPage({ params }: Props) {
  const { data, error, isLoading } = useSWR(
    `/api/v1/user/${params.userId}/page`,
    async (url) => (await apiGet(url as `/api/v1/user/${string}/page`)).data
  )

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error)
    return <ErrorMessage>プロフィールの取得に失敗しました</ErrorMessage>
  if (!data) return null

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-4 lg:grid-cols-[1fr_320px]">
      <section className="order-2 lg:order-1">
        <h1 className="mb-4 text-2xl font-bold">
          {data.name} さんのヒストリー
        </h1>
        <div className="space-y-3">
          {data.histories.map((item, idx) => (
            <HistoryItemCard
              key={`${item.type}-${item.occurredAt}-${idx}`}
              item={item}
            />
          ))}
        </div>
      </section>

      <aside className="order-1 rounded-lg border bg-white p-4 lg:order-2">
        <h2 className="mb-3 text-lg font-semibold">保有バイク</h2>
        <ul className="space-y-2 text-sm">
          {data.bikes.map((bike) => (
            <li key={bike.myUserBikeId} className="rounded border p-2">
              <div className="font-medium">
                {bike.nickname || bike.modelName || 'バイク'}
              </div>
              <div className="text-xs text-gray-600">
                {bike.manufacturerName || 'メーカー不明'}
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
