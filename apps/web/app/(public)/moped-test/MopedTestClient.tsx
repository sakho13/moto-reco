'use client'

import { useEffect, useState } from 'react'
import {
  ApiResponseMopedTestQuestion,
  ApiResponseMopedTestQuestionSet,
  MopedTestAnswerOption,
} from '@repo/shared-types'
import { HistorySection } from './HistorySection'
import styles from './page.module.css'
import { SwipeCardDeck } from './SwipeCardDeck'
import { getCurrentDate } from '@repo/shared-utils'

type AnswerMap = Record<string, MopedTestAnswerOption>

export type AnswerRecord = {
  questionId: string
  selected: MopedTestAnswerOption
  isCorrect: boolean
}

export type TestSession = {
  sessionId: string
  submittedAt: string
  score: number
  totalCount: number
  passScore: number
  isPassed: boolean
  answers: AnswerRecord[]
}

// 移行用：旧フォーマット
type LegacyTestResult = {
  score: number
  submittedAt: string
}

const HISTORY_STORAGE_KEY = 'moped-test:history'
const LEGACY_RESULT_STORAGE_KEY = 'moped-test:last-result'

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

function loadHistory(): TestSession[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as TestSession[]
    }
    // 旧フォーマットからの移行
    const legacy = localStorage.getItem(LEGACY_RESULT_STORAGE_KEY)
    if (legacy) {
      const old = JSON.parse(legacy) as LegacyTestResult
      const migrated: TestSession = {
        sessionId: 'legacy',
        submittedAt: old.submittedAt,
        score: old.score,
        totalCount: 0,
        passScore: 0,
        isPassed: false,
        answers: [],
      }
      localStorage.removeItem(LEGACY_RESULT_STORAGE_KEY)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([migrated]))
      return [migrated]
    }
  } catch {
    // 不正データは無視
  }
  return []
}

export function MopedTestClient() {
  const [questionSet, setQuestionSet] =
    useState<ApiResponseMopedTestQuestionSet | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState<TestSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
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

    setHistory(loadHistory())
    fetchQuestions()
  }, [])

  const onComplete = (finalAnswers: AnswerMap) => {
    if (!questionSet) return

    const finalScore = calcScore(questionSet.questions, finalAnswers)

    const answerRecords: AnswerRecord[] = questionSet.questions.map((q) => ({
      questionId: q.questionId,
      selected: finalAnswers[q.questionId] ?? 'false',
      isCorrect: finalAnswers[q.questionId] === q.correctAnswer,
    }))

    const newSession: TestSession = {
      sessionId: Date.now().toString(36),
      submittedAt: getCurrentDate().toISOString(),
      score: finalScore,
      totalCount: questionSet.questionCount,
      passScore: questionSet.passScore,
      isPassed: finalScore >= questionSet.passScore,
      answers: answerRecords,
    }

    const updatedHistory = [newSession, ...history]
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
    } catch {
      // localStorage が使えない環境では無視
    }
    setHistory(updatedHistory)
    setAnswers(finalAnswers)
    setScore(finalScore)
    setSubmitted(true)
  }

  const onReset = () => {
    setAnswers({})
    setScore(0)
    setSubmitted(false)
    setShowHistory(false)
  }

  const onClearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch {
      // ignore
    }
    setHistory([])
    setShowHistory(false)
  }

  const onToggleHistory = () => {
    setShowHistory((prev) => !prev)
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
  const lastSession = history[0] ?? null

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
        {lastSession && (
          <p className={styles.lastResult}>
            前回結果: {lastSession.score}点（
            {new Date(lastSession.submittedAt).toLocaleString('ja-JP')}）
          </p>
        )}
        {history.length > 0 && (
          <button
            type="button"
            onClick={onToggleHistory}
            className={styles.historyToggleButton}
          >
            {showHistory ? '履歴を閉じる' : `履歴を見る（${history.length}件）`}
          </button>
        )}
      </header>

      {showHistory && (
        <HistorySection history={history} onClearHistory={onClearHistory} />
      )}

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
            <button
              type="button"
              onClick={onToggleHistory}
              className={styles.historyToggleButton}
            >
              {showHistory
                ? '履歴を閉じる'
                : `履歴を見る（${history.length}件）`}
            </button>
          </footer>

          {showHistory && (
            <HistorySection history={history} onClearHistory={onClearHistory} />
          )}
        </div>
      )}
    </main>
  )
}
