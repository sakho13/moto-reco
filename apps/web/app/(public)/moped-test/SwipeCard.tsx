'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiResponseMopedTestQuestion } from '@repo/shared-types'
import styles from './page.module.css'

type SwipeDirection = 'left' | 'right'

type DragState = {
  isDragging: boolean
  startX: number
  deltaX: number
  startTime: number
}

type Props = {
  question: ApiResponseMopedTestQuestion
  questionIndex: number
  totalCount: number
  onSwipe: (direction: SwipeDirection) => void
  isTop: boolean
  onDragChange?: (deltaX: number) => void
}

const SWIPE_THRESHOLD = 55
const VELOCITY_THRESHOLD = 0.2

const INITIAL_DRAG: DragState = {
  isDragging: false,
  startX: 0,
  deltaX: 0,
  startTime: 0,
}

export function SwipeCard({
  question,
  questionIndex,
  totalCount,
  onSwipe,
  isTop,
  onDragChange,
}: Props) {
  const [drag, setDrag] = useState<DragState>(INITIAL_DRAG)
  const [exitDirection, setExitDirection] = useState<SwipeDirection | null>(
    null
  )
  const isAnimating = useRef(false)
  const pendingExitRef = useRef<SwipeDirection | null>(null)

  // 回転角度 — 上限なしで自然に増加
  const rotation = drag.deltaX * 0.1

  const trueOverlayOpacity = Math.min(
    1,
    Math.max(0, drag.deltaX) / SWIPE_THRESHOLD
  )
  const falseOverlayOpacity = Math.min(
    1,
    Math.max(0, -drag.deltaX) / SWIPE_THRESHOLD
  )

  // Step2: drag.isDragging が false になったら退場アニメーション開始
  // （1フレーム分カードを現在位置に留めてから transition で退場させる）
  useEffect(() => {
    if (pendingExitRef.current !== null && !drag.isDragging) {
      setExitDirection(pendingExitRef.current)
      pendingExitRef.current = null
    }
  }, [drag.isDragging])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isTop || isAnimating.current) return
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrag({
        isDragging: true,
        startX: e.clientX,
        deltaX: 0,
        startTime: Date.now(),
      })
    },
    [isTop]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.isDragging) return
      const deltaX = e.clientX - drag.startX
      setDrag((prev) => ({ ...prev, deltaX }))
      onDragChange?.(deltaX)
    },
    [drag.isDragging, drag.startX, onDragChange]
  )

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (isAnimating.current) return
      isAnimating.current = true
      onDragChange?.(0)
      if (drag.isDragging) {
        // ドラッグ中: isDragging を false に戻してから useEffect で退場開始
        pendingExitRef.current = direction
        setDrag((prev) => ({ ...prev, isDragging: false }))
      } else {
        // ボタン押下など（ドラッグなし）: 直接退場アニメーションを開始
        setExitDirection(direction)
      }
    },
    [drag.isDragging, onDragChange]
  )

  const handlePointerUp = useCallback(() => {
    if (!drag.isDragging) return
    const { deltaX, startTime } = drag
    const elapsed = Date.now() - startTime
    const velocity = elapsed > 0 ? Math.abs(deltaX) / elapsed : 0
    if (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      triggerSwipe(deltaX > 0 ? 'right' : 'left')
    } else {
      setDrag(INITIAL_DRAG)
      onDragChange?.(0)
    }
  }, [drag, triggerSwipe, onDragChange])

  const handlePointerCancel = useCallback(() => {
    setDrag(INITIAL_DRAG)
    onDragChange?.(0)
  }, [onDragChange])

  // transitionend は transform と opacity の2回発火するので transform のみ受け取る
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName === 'transform' && exitDirection) {
        onSwipe(exitDirection)
      }
    },
    [exitDirection, onSwipe]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isTop || isAnimating.current) return
      if (e.key === 'ArrowRight') triggerSwipe('right')
      if (e.key === 'ArrowLeft') triggerSwipe('left')
    },
    [isTop, triggerSwipe]
  )

  const cardStyle: React.CSSProperties = (() => {
    if (exitDirection) {
      // 退場: 現在位置から自然にスライドアウト（transition で滑らか）
      const targetX = exitDirection === 'right' ? '150%' : '-150%'
      const targetRotate = exitDirection === 'right' ? 25 : -25
      return {
        transform: `translateX(${targetX}) rotate(${targetRotate}deg)`,
        opacity: 0,
        transition: 'transform 0.35s ease-in, opacity 0.3s ease-in',
        pointerEvents: 'none' as const,
      }
    }
    if (drag.isDragging || drag.deltaX !== 0) {
      return {
        transform: `translateX(${drag.deltaX}px) rotate(${rotation}deg)`,
      }
    }
    return {}
  })()

  const cardClassName = [
    styles.swipeCard,
    !drag.isDragging && !exitDirection && drag.deltaX === 0
      ? styles.snapBack
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cardClassName}
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTransitionEnd={handleTransitionEnd}
      onKeyDown={handleKeyDown}
      tabIndex={isTop ? 0 : -1}
      role="article"
      aria-label={`問題${questionIndex + 1}: ${question.statement}`}
    >
      {/* 正しいオーバーレイ（右スワイプ） */}
      <div
        className={`${styles.swipeOverlay} ${styles.overlayTrue}`}
        style={{ opacity: trueOverlayOpacity }}
        aria-hidden="true"
      >
        ◯ 正しい
      </div>

      {/* 誤りオーバーレイ（左スワイプ） */}
      <div
        className={`${styles.swipeOverlay} ${styles.overlayFalse}`}
        style={{ opacity: falseOverlayOpacity }}
        aria-hidden="true"
      >
        ✕ 誤り
      </div>

      <div className={styles.swipeCardContent}>
        <p className={styles.questionCategory}>{question.category}</p>
        <p className={styles.questionNumber}>
          {questionIndex + 1} / {totalCount}
        </p>
        <h2 className={styles.questionStatement}>{question.statement}</h2>

        {question.imagePath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/${question.imagePath}`}
            alt="問題の図"
            className={styles.questionImage}
            draggable={false}
          />
        )}

        <div
          className={styles.hintButtons}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={styles.hintButtonFalse}
            onClick={() => triggerSwipe('left')}
            disabled={!isTop}
            aria-label="誤り"
          >
            ✕ 誤り ←
          </button>
          <button
            type="button"
            className={styles.hintButtonTrue}
            onClick={() => triggerSwipe('right')}
            disabled={!isTop}
            aria-label="正しい"
          >
            → ◯ 正しい
          </button>
        </div>
      </div>
    </div>
  )
}
