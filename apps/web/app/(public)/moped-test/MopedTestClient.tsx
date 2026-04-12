'use client'

import { useEffect, useState } from 'react'
import {
  ApiResponseMopedTestQuestion,
  ApiResponseMopedTestQuestionSet,
  MopedTestAnswerOption,
} from '@repo/shared-types'
import styles from './page.module.css'
import { SwipeCardDeck } from './SwipeCardDeck'

type AnswerMap = Record<string, MopedTestAnswerOption>

type TestResult = {
  score: number
  submittedAt: string
}

const RESULT_STORAGE_KEY = 'moped-test:last-result'

function calcScore(
  questions: ApiResponseMopedTestQuestion[],
  answers: AnswerMap
): number {
  return questions.reduce((point, question) => {
    return answers[question.questionId] === question.correctAnswer
      ? point + 1
      : point
  }, 0)
}

export function MopedTestClient() {
  const [questionSet, setQuestionSet] =
    useState<ApiResponseMopedTestQuestionSet | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [lastResult, setLastResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/v1/public/moped-test/questions')
        if (!response.ok) {
          throw new Error('問題データの取得に失敗しました。')
        }
        const json = await response.json()
        setQuestionSet(json.data)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '不明なエラーが発生しました。'
        )
      } finally {
        setLoading(false)
      }
    }

    const stored = localStorage.getItem(RESULT_STORAGE_KEY)
    if (stored) {
      setLastResult(JSON.parse(stored) as TestResult)
    }

    fetchQuestions()
  }, [])

  const onComplete = (finalAnswers: AnswerMap) => {
    if (!questionSet) return
    // setState の非同期を避けるため finalAnswers を直接使用してスコアを計算
    const finalScore = calcScore(questionSet.questions, finalAnswers)
    const result: TestResult = {
      score: finalScore,
      submittedAt: new Date().toISOString(),
    }
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result))
    setAnswers(finalAnswers)
    setScore(finalScore)
    setLastResult(result)
    setSubmitted(true)
  }

  const onReset = () => {
    setAnswers({})
    setScore(0)
    setSubmitted(false)
  }

  if (loading) {
    return <div className={styles.page}>読み込み中...</div>
  }

  if (!questionSet || errorMessage) {
    return (
      <div className={styles.page}>
        問題の取得に失敗しました: {errorMessage}
      </div>
    )
  }

  const isPassed = score >= questionSet.passScore

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{questionSet.title}</h1>
        <p>
          全{questionSet.questionCount}問・合格ライン {questionSet.passScore}点
        </p>
        <p className={styles.version}>
          データバージョン: {questionSet.version}
        </p>
        {lastResult && (
          <p className={styles.lastResult}>
            前回結果: {lastResult.score}点（
            {new Date(lastResult.submittedAt).toLocaleString('ja-JP')}）
          </p>
        )}
      </header>

      {!submitted ? (
        <SwipeCardDeck
          questions={questionSet.questions}
          onComplete={onComplete}
        />
      ) : (
        <div className={styles.resultScreen}>
          <div className={styles.resultSummaryBox}>
            <p className={styles.resultScore}>
              {score}
              <span className={styles.resultScoreUnit}>
                {' '}
                / {questionSet.questionCount} 点
              </span>
            </p>
            <p
              className={`${styles.resultPassLabel} ${isPassed ? styles.resultPass : styles.resultFail}`}
            >
              {isPassed ? '合格' : '不合格'}
            </p>
          </div>

          <div className={styles.resultQuestionList}>
            {questionSet.questions.map((question, index) => {
              const selected = answers[question.questionId]
              const isCorrect = selected === question.correctAnswer

              return (
                <article
                  key={question.questionId}
                  className={styles.resultQuestionItem}
                >
                  <p className={styles.questionCategory}>{question.category}</p>
                  <h3>
                    Q{index + 1}. {question.statement}
                  </h3>
                  <p
                    className={`${styles.resultJudge} ${isCorrect ? styles.correct : styles.incorrect}`}
                  >
                    {isCorrect ? '✅ 正解' : '❌ 不正解'}
                  </p>
                  <p className={styles.resultExplanation}>
                    {question.explanation}
                  </p>
                </article>
              )
            })}
          </div>

          <footer className={styles.resultFooter}>
            <button
              type="button"
              onClick={onReset}
              className={styles.retryButton}
            >
              もう一度挑戦
            </button>
          </footer>
        </div>
      )}
    </main>
  )
}
