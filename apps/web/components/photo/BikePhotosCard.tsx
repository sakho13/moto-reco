'use client'

import { useRef } from 'react'
import useSWR from 'swr'
import type {
  ApiResponseBikePhotoList,
  ApiResponsePhotoDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import styles from './BikePhotosCard.module.css'
import { authenticatedFetch } from '@/lib/api/client'
import { PHOTO_ACCEPT, usePhotoActions } from '@/lib/hooks/usePhotoActions'

type Props = {
  myUserBikeId: string
}

export function BikePhotosCard({ myUserBikeId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const photosKey = `/api/v1/photo/bike/${myUserBikeId}`

  const { data: photos, mutate } = useSWR<ApiResponsePhotoDetail[]>(
    photosKey,
    async (url: string) => {
      const res = await authenticatedFetch(url, { method: 'GET' })
      const json =
        (await res.json()) as SuccessResponse<ApiResponseBikePhotoList>
      return json.data
    }
  )

  const { isUploading, deletingId, upload, remove } = usePhotoActions({
    registerUrl: photosKey,
    onChange: () => mutate(),
  })

  return (
    <BaseCard
      title="写真"
      data-testid="bike-photos-section"
      headerAction={
        <>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="cloud"
            size="sm"
            aria-label="写真を追加"
          >
            {isUploading ? '...' : '＋'}
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
        </>
      }
    >
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
        <p
          className="text-sm select-none"
          style={{ color: 'var(--color-inkLight)' }}
        >
          写真はまだ追加されていません
        </p>
      )}
    </BaseCard>
  )
}
