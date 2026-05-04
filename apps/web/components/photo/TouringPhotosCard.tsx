'use client'

import { useRef, useState } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  ApiResponsePhotoDetail,
  ApiResponseTouringPhotoList,
  ApiResponsePhotoUploadUrl,
  SuccessResponse,
} from '@repo/shared-types'
import { toast } from '@repo/ui/sonner'
import styles from './TouringPhotosCard.module.css'
import { authenticatedFetch } from '@/lib/api/client'

type Props = {
  touringId: string
  cardClassName: string
  mutedTextClassName: string
  editButtonClassName: string
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type AcceptedType = (typeof ACCEPTED_TYPES)[number]

const isAcceptedType = (type: string): type is AcceptedType =>
  (ACCEPTED_TYPES as readonly string[]).includes(type)

export function TouringPhotosCard({
  touringId,
  cardClassName,
  mutedTextClassName,
  editButtonClassName,
}: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const photosKey = `/api/v1/photo/touring/${touringId}`

  const { data: photos } = useSWR<ApiResponsePhotoDetail[]>(
    photosKey,
    async (url: string) => {
      const res = await authenticatedFetch(url, { method: 'GET' })
      const json =
        (await res.json()) as SuccessResponse<ApiResponseTouringPhotoList>
      return json.data
    }
  )

  const handleFileChange = async (files: FileList) => {
    if (files.length === 0) return

    const file = files[0]!
    if (!isAcceptedType(file.type)) {
      toast.error('JPEG・PNG・WebP のみアップロードできます')
      return
    }

    setIsUploading(true)
    try {
      // 1. 署名付きアップロードURLを取得
      const urlRes = await authenticatedFetch('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, count: files.length }),
      })
      if (!urlRes.ok) throw new Error('URL取得失敗')
      const urlJson =
        (await urlRes.json()) as SuccessResponse<ApiResponsePhotoUploadUrl>
      const signedUrls = urlJson.data

      // 2. 各ファイルを署名付きURLにPUT
      const photoPaths: { photoPath: string; takenAt: string }[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]!
        const { signedUploadUrl, photoPath } = signedUrls[i]!
        const putRes = await fetch(signedUploadUrl, {
          method: 'PUT',
          body: f,
          headers: { 'Content-Type': f.type },
        })
        if (!putRes.ok) throw new Error('ファイルアップロード失敗')
        photoPaths.push({ photoPath, takenAt: new Date().toISOString() })
      }

      // 3. 写真をツーリングに紐づけ
      const registerRes = await authenticatedFetch(
        `/api/v1/photo/touring/${touringId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos: photoPaths }),
        }
      )
      if (!registerRes.ok) throw new Error('写真登録失敗')

      await mutate(photosKey)
      toast.success('写真を追加しました')
    } catch {
      toast.error('写真の追加に失敗しました')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (photoId: string) => {
    setDeletingId(photoId)
    try {
      const res = await authenticatedFetch(`/api/v1/photo/${photoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('削除失敗')
      await mutate(photosKey)
      toast.success('写真を削除しました')
    } catch {
      toast.error('写真の削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">写真</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={editButtonClassName}
          aria-label="写真を追加"
          title="写真を追加"
        >
          {isUploading ? '...' : '＋'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => e.target.files && handleFileChange(e.target.files)}
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
                onClick={() => handleDelete(photo.photoId)}
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
