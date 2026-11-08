'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ApiResponsePhotoDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './PhotoViewerModal.module.css'
import { ModalBase } from '@/components/common/ModalBase'

type Props = {
  /** 見出し。写真の代替テキストにも使う */
  title: string
  photos: ApiResponsePhotoDetail[]
  initialIndex: number
  onClose: () => void
}

/**
 * 写真の拡大表示
 *
 * @remarks
 * 複数枚あるときはボタンかキーボードの左右キーで前後の写真へ移る。端まで行くと反対の端へ戻る。
 */
export function PhotoViewerModal({
  title,
  photos,
  initialIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex)
  const count = photos.length
  const hasMany = count > 1

  useEffect(() => {
    if (count <= 1) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count)
      if (event.key === 'ArrowRight') setIndex((i) => (i + 1) % count)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [count])

  const photo = photos[Math.min(index, count - 1)]
  if (!photo) return null

  return (
    <ModalBase title={title} onClose={onClose} size="lg">
      <figure className={styles.figure}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.photoUrl}
          alt={hasMany ? `${title} ${index + 1}枚目` : title}
          className={styles.image}
        />
        {photo.memo && (
          <figcaption className={styles.caption}>{photo.memo}</figcaption>
        )}
      </figure>

      {hasMany && (
        <div className={styles.controls}>
          <Button
            type="button"
            variant="cloud"
            size="icon"
            aria-label="前の写真"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <p className={styles.counter} aria-live="polite">
            {index + 1} / {count}
          </p>
          <Button
            type="button"
            variant="cloud"
            size="icon"
            aria-label="次の写真"
            onClick={() => setIndex((i) => (i + 1) % count)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </ModalBase>
  )
}
