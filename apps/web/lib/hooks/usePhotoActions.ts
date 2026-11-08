'use client'

import { useState } from 'react'
import { PHOTO_MAX_COUNT, PHOTO_MAX_FILE_SIZE_BYTES } from '@repo/shared-types'
import type {
  ApiResponsePhotoUploadUrl,
  SuccessResponse,
} from '@repo/shared-types'
import { toast } from '@repo/ui/sonner'
import { authenticatedFetch } from '@/lib/api/client'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** `<input type="file">` の `accept` に渡す値 */
export const PHOTO_ACCEPT = ACCEPTED_TYPES.join(',')

const isAcceptedType = (type: string): boolean =>
  (ACCEPTED_TYPES as readonly string[]).includes(type)

/** アップロードできないファイルがあれば、その理由を返す */
const findInvalidReason = (files: File[]): string | null => {
  if (files.length > PHOTO_MAX_COUNT) {
    return `一度に追加できる写真は${PHOTO_MAX_COUNT}枚までです`
  }
  if (files.some((file) => !isAcceptedType(file.type))) {
    return 'JPEG・PNG・WebP のみアップロードできます'
  }
  if (files.some((file) => file.size > PHOTO_MAX_FILE_SIZE_BYTES)) {
    return `1枚あたり${PHOTO_MAX_FILE_SIZE_BYTES / 1024 / 1024}MBまでの写真を選んでください`
  }
  return null
}

type Options = {
  /** アップロードした写真を紐づける登録API */
  registerUrl: string
  /** 追加・削除のあとに呼ぶ。表示中の一覧の再取得に使う */
  onChange: () => Promise<unknown>
  /**
   * 結果の知らせ方
   *
   * @remarks
   * `toast` は成功も失敗もトーストで出す。`inline` は成功を知らせず、失敗を `errorMessage` に入れる。
   *
   * @default 'toast'
   */
  feedback?: 'toast' | 'inline'
}

/**
 * 写真の追加と削除
 *
 * @remarks
 * 追加は 署名付きURLの取得 → Storageへのアップロード → `registerUrl` への登録 の順に行う。
 */
export function usePhotoActions({
  registerUrl,
  onChange,
  feedback = 'toast',
}: Options) {
  const [uploadingCount, setUploadingCount] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const notifySuccess = (message: string) => {
    if (feedback === 'toast') toast.success(message)
  }
  const notifyError = (message: string) => {
    if (feedback === 'toast') toast.error(message)
    else setErrorMessage(message)
  }

  const upload = async (fileList: FileList | File[]): Promise<void> => {
    const files = Array.from(fileList)
    if (files.length === 0) return
    setErrorMessage(null)

    const invalidReason = findInvalidReason(files)
    if (invalidReason) {
      notifyError(invalidReason)
      return
    }

    setUploadingCount(files.length)
    try {
      const urlRes = await authenticatedFetch('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((file) => ({
            contentType: file.type,
            fileName: file.name,
            fileSize: file.size,
          })),
        }),
      })
      if (!urlRes.ok) throw new Error('URL取得失敗')
      const urlJson =
        (await urlRes.json()) as SuccessResponse<ApiResponsePhotoUploadUrl>

      const photoPaths: { photoPath: string; takenAt: string }[] = []
      for (const [index, file] of files.entries()) {
        const { signedUploadUrl, photoPath, uploadMethod } =
          urlJson.data[index]!
        const uploadRes = await fetch(signedUploadUrl, {
          method: uploadMethod,
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!uploadRes.ok) throw new Error('ファイルアップロード失敗')
        photoPaths.push({ photoPath, takenAt: new Date().toISOString() })
      }

      const registerRes = await authenticatedFetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: photoPaths }),
      })
      if (!registerRes.ok) throw new Error('写真登録失敗')

      await onChange()
      notifySuccess('写真を追加しました')
    } catch {
      notifyError('写真の追加に失敗しました')
    } finally {
      setUploadingCount(0)
    }
  }

  const remove = async (photoId: string): Promise<void> => {
    setErrorMessage(null)
    setDeletingId(photoId)
    try {
      const res = await authenticatedFetch(`/api/v1/photo/${photoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('削除失敗')
      await onChange()
      notifySuccess('写真を削除しました')
    } catch {
      notifyError('写真の削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  return {
    isUploading: uploadingCount > 0,
    uploadingCount,
    deletingId,
    errorMessage,
    upload,
    remove,
  }
}
