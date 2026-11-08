'use client'

import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { FormField } from '@repo/ui/formField'
import styles from './SpotPhotosField.module.css'
import { PhotoDeleteConfirmModal } from '@/components/photo/PhotoDeleteConfirmModal'
import { PHOTO_ACCEPT, usePhotoActions } from '@/lib/hooks/usePhotoActions'
import { useTouringSpotPhotos } from '@/lib/hooks/useTouringSpotPhotos'

type Props = {
  touringId: string
  spotId: string
}

/**
 * スポット編集の写真欄
 *
 * @remarks
 * 追加と削除はフォームの送信を待たずにその場で保存する。一覧はツーリング詳細と同じ取得結果を共有する。
 */
export function SpotPhotosField({ touringId, spotId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const { photosBySpotId, mutate } = useTouringSpotPhotos(touringId, true)
  const photos = photosBySpotId.get(spotId) ?? []
  const {
    isUploading,
    uploadingCount,
    deletingId,
    errorMessage,
    upload,
    remove,
  } = usePhotoActions({
    registerUrl: `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
    onChange: () => mutate(),
    feedback: 'inline',
  })

  const handleConfirmDelete = async () => {
    const photoId = confirmingId
    setConfirmingId(null)
    if (photoId) await remove(photoId)
  }

  return (
    <FormField label="写真" helperText="追加と削除はすぐに保存されます">
      <div className={styles.field}>
        {photos.length > 0 ? (
          <ul className={styles.grid}>
            {photos.map((photo, i) => (
              <li key={photo.photoId} className={styles.item}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photoUrl}
                  alt={`${i + 1}枚目`}
                  className={styles.image}
                  loading="lazy"
                  decoding="async"
                />
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`${i + 1}枚目の写真を削除`}
                  disabled={deletingId === photo.photoId}
                  onClick={() => setConfirmingId(photo.photoId)}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !isUploading && <p className={styles.empty}>写真はまだありません</p>
        )}

        <Button
          type="button"
          variant="cloud"
          disabled={isUploading}
          aria-busy={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? `${uploadingCount}枚を追加中…` : '＋ 写真を追加'}
        </Button>
        {errorMessage && (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          multiple
          hidden
          aria-label="追加する写真"
          onChange={async (e) => {
            const input = e.currentTarget
            if (input.files) await upload(input.files)
            input.value = ''
          }}
        />
      </div>

      {confirmingId && (
        <PhotoDeleteConfirmModal
          onCancel={() => setConfirmingId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </FormField>
  )
}
