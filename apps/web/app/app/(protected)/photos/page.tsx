'use client'

import { useEffect, useRef, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import type {
  ApiResponseUserPhotoList,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { toast } from '@repo/ui/sonner'
import styles from './page.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

const PAGE_SIZE = 30

const ATTACHMENT_LABEL: Record<string, string> = {
  TOURING: 'ツーリング',
  SPOT: 'スポット',
  BIKE: 'バイク',
}

function PhotosPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPhotos = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseUserPhotoList>
    return json.data
  }

  const { data, error, isLoading, size, setSize, isValidating, mutate } =
    useSWRInfinite(
      (pageIndex) =>
        `/api/v1/photo?per-size=${PAGE_SIZE}&page=${pageIndex + 1}`,
      fetchPhotos
    )

  const photos = data ? data.flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === PAGE_SIZE
  const isLoadingMore = isValidating && !isLoading && size > 0

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sentinelRef.current || !canLoadMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          setSize((s) => s + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [canLoadMore, isLoadingMore, setSize])

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId)
    try {
      const res = await authenticatedFetch(`/api/v1/photo/${photoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('削除失敗')
      await mutate()
      toast.success('写真を削除しました')
    } catch {
      toast.error('写真の削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-md">
        <div className={styles.errorCard}>
          <h1 className={styles.errorTitle}>エラー</h1>
          <p className={styles.errorMessage}>
            {error instanceof ApiV1Error
              ? error.message
              : '写真の取得に失敗しました'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <BaseCard title="フォト" data-testid="photos-section">
        {photos.length > 0 ? (
          <div className={styles.photoGrid}>
            {photos.map((photo) => (
              <div key={photo.photoId} className={styles.photoWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photoUrl}
                  alt={photo.memo ?? ''}
                  className={styles.photoImage}
                />
                {photo.attachments.length > 0 && (
                  <span className={styles.attachmentBadge}>
                    {photo.attachments
                      .map((a) => ATTACHMENT_LABEL[a.type])
                      .join('・')}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(photo.photoId)}
                  disabled={deletingId === photo.photoId}
                  className={styles.deleteButton}
                  aria-label="写真を削除"
                >
                  ×
                </button>
              </div>
            ))}
            <div ref={sentinelRef} className={styles.sentinel} />
            {isLoadingMore && (
              <p className={styles.loadingMore}>読み込み中...</p>
            )}
          </div>
        ) : (
          <p className={styles.empty}>写真はまだありません</p>
        )}
      </BaseCard>
    </div>
  )
}

export default withAuth(PhotosPage)
