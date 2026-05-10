'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { apiDelete, apiGet, apiPost } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

type SearchUser = {
  userId: string
  name: string
  isFollowing: boolean
}

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [followLoadingMap, setFollowLoadingMap] = useState<
    Record<string, boolean>
  >({})

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await apiGet(
        `/api/v1/user/search?q=${encodeURIComponent(query.trim())}` as '/api/v1/user/search'
      )
      setResults(res.data.users)
      setTotal(res.data.total)
      const map: Record<string, boolean> = {}
      res.data.users.forEach((u) => {
        map[u.userId] = u.isFollowing
      })
      setFollowingMap(map)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    if (followLoadingMap[userId]) return
    setFollowLoadingMap((prev) => ({ ...prev, [userId]: true }))
    try {
      if (followingMap[userId]) {
        await apiDelete(
          `/api/v1/user/${userId}/follow` as `/api/v1/user/${string}/follow`
        )
        setFollowingMap((prev) => ({ ...prev, [userId]: false }))
      } else {
        await apiPost(
          `/api/v1/user/${userId}/follow` as `/api/v1/user/${string}/follow`,
          {}
        )
        setFollowingMap((prev) => ({ ...prev, [userId]: true }))
      }
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <BaseCard title="ユーザーを探す">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ユーザー名で検索"
          />
          <Button type="submit" loading={loading} disabled={!query.trim()}>
            検索
          </Button>
        </form>
      </BaseCard>

      {searched && (
        <BaseCard title={`検索結果 ${total > 0 ? `（${total} 件）` : ''}`}>
          {results.length === 0 ? (
            <p className="text-sm text-gray-500">
              ユーザーが見つかりませんでした
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {results.map((user) => (
                <li
                  key={user.userId}
                  className="flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/app/users/${user.userId}`}
                    className="flex items-center gap-2 hover:opacity-70"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </Link>
                  <Button
                    variant={followingMap[user.userId] ? 'cloud' : 'primary'}
                    size="sm"
                    loading={!!followLoadingMap[user.userId]}
                    onClick={() => handleFollow(user.userId)}
                  >
                    {followingMap[user.userId] ? 'フォロー中' : 'フォロー'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </BaseCard>
      )}
    </div>
  )
}

export default withAuth(SearchPage)
