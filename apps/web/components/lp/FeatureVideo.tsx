'use client'

import { useEffect, useRef } from 'react'
import styles from './FeatureVideo.module.css'

type Props = {
  /** 動画（WebM）のパス */
  src: string
  /** 再生前と、動きを減らす設定のときに見せる静止画のパス */
  poster: string
}

/**
 * アプリの操作動画を、スマホの枠に入れて音なしで繰り返し流す
 *
 * @remarks
 * 画面に半分以上入ったときに読み込んで再生し、外れたら止める。
 * OS で動きを減らす設定にしている場合は再生せず、静止画だけを見せる。
 * 読み上げの対象からは外している。
 */
export function FeatureVideo({ src, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.play().catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.phone} aria-hidden="true">
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        width={390}
        height={844}
        muted
        loop
        playsInline
        preload="none"
      />
    </div>
  )
}
