'use client'

import { useRef } from 'react'
import useSWR from 'swr'
import type {
  ApiResponsePhotoDetail,
  ApiResponseTouringPhotoList,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './TouringPhotosCard.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { PHOTO_ACCEPT, usePhotoActions } from '@/lib/hooks/usePhotoActions'

type Props = {
  touringId: string
  cardClassName: string
  mutedTextClassName: string
}

export function TouringPhotosCard({
  touringId,
  cardClassName,
  mutedTextClassName,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const photosKey = `/api/v1/photo/touring/${touringId}`

  const { data: photos, mutate } = useSWR<ApiResponsePhotoDetail[]>(
    photosKey,
    async (url: string) => {
      const res = await authenticatedFetch(url, { method: 'GET' })
      const json =
        (await res.json()) as SuccessResponse<ApiResponseTouringPhotoList>
      return json.data
    }
  )

  const { isUploading, deletingId, upload, remove } = usePhotoActions({
    registerUrl: photosKey,
    onChange: () => mutate(),
  })

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={styles.heading}>この旅の写真</h2>
        <Button
          type="button"
          variant="cloud"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? '追加中...' : '＋ 写真を追加'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          multiple
          hidden
          onChange={async (e) => {
            const input = e.currentTarget
            if (input.files) await upload(input.files)
            input.value = ''
          }}
        />
      </div>

      {photos && photos.length > 0 ? (
        <div className={styles.photoGrid}>
          {photos.map((photo) => (
            <div key={photo.photoId} className={styles.photoWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.photoUrl}
                alt={photo.memo ?? ''}
                className={styles.photoImage}
              />
              <button
                onClick={() => remove(photo.photoId)}
                disabled={deletingId === photo.photoId}
                className={styles.deleteButton}
                aria-label="写真を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-sm ${mutedTextClassName}`}>
          写真はまだ追加されていません
        </p>
      )}
    </div>
  )
}
