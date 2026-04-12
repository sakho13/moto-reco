'use client'

import { useCallback, useState } from 'react'
import type {
  ApiResponseMopedTestQuestion,
  MopedTestAnswerOption,
} from '@repo/shared-types'
import styles from './page.module.css'
import { SwipeCard } from './SwipeCard'

type AnswerMap = Record<string, MopedTestAnswerOption>

type Props = {
  questions: ApiResponseMopedTestQuestion[]
  onComplete: (answers: AnswerMap) => void
}

export function SwipeCardDeck({ questions, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<AnswerMap>({})
  const [topCardDeltaX, setTopCardDeltaX] = useState(0)

  const topQuestion = questions[currentIndex] ?? null
  const behindQuestion = questions[currentIndex + 1] ?? null

  const progress = (currentIndex / questions.length) * 100
  // behindカードはtopカードのドラッグ量に応じてscaleを変化させる
  const behindScale = 0.96 + 0.04 * Math.min(1, Math.abs(topCardDeltaX) / 80)

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const question = questions[currentIndex]
      if (!question) return
      const answer: MopedTestAnswerOption =
        direction === 'right' ? 'true' : 'false'
      const newAnswers = { ...localAnswers, [question.questionId]: answer }
      setLocalAnswers(newAnswers)
      setTopCardDeltaX(0)
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      if (nextIndex >= questions.length) {
        onComplete(newAnswers)
      }
    },
    [currentIndex, questions, localAnswers, onComplete]
  )

  if (!topQuestion) return null

  return (
    <div className={styles.deckWrapper}>
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={currentIndex}
        aria-valuemax={questions.length}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className={styles.progressLabel} aria-live="polite">
        {currentIndex + 1} / {questions.length} 問
      </p>

      <div className={styles.swipeDeck}>
        {/* 背後のカード */}
        {behindQuestion && (
          <div
            className={styles.swipeCardBehind}
            style={{ transform: `scale(${behindScale})` }}
            aria-hidden="true"
          >
            <div className={styles.swipeCardBehindInner} />
          </div>
        )}

        {/* トップカード */}
        <SwipeCard
          key={topQuestion.questionId}
          question={topQuestion}
          questionIndex={currentIndex}
          totalCount={questions.length}
          onSwipe={handleSwipe}
          isTop={true}
          onDragChange={setTopCardDeltaX}
        />
      </div>

      <p className={styles.swipeHint}>左スワイプ：誤り / 右スワイプ：正しい</p>
    </div>
  )
}
