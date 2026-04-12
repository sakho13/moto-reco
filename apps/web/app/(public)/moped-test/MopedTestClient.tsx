'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ApiResponseMopedTestQuestion,
  ApiResponseMopedTestQuestionSet,
  MopedTestAnswerOption,
} from '@repo/shared-types'
import styles from './page.module.css'

type AnswerMap = Record<string, MopedTestAnswerOption>

type TestResult = {
  score: number
  submittedAt: string
}

const RESULT_STORAGE_KEY = 'moped-test:last-result'

export function MopedTestClient() {
  const [questionSet, setQuestionSet] =
    useState<ApiResponseMopedTestQuestionSet | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [submitted, setSubmitted] = useState(false)
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

  const score = useMemo(() => {
    if (!questionSet) {
      return 0
    }

    return questionSet.questions.reduce((point, question) => {
      return answers[question.questionId] === question.correctAnswer
        ? point + 1
        : point
    }, 0)
  }, [answers, questionSet])

  const isPassed = questionSet ? score >= questionSet.passScore : false

  const onChangeAnswer = (
    question: ApiResponseMopedTestQuestion,
    answer: MopedTestAnswerOption
  ) => {
    setAnswers((prev) => ({ ...prev, [question.questionId]: answer }))
  }

  const onSubmit = () => {
    if (!questionSet) {
      return
    }

    setSubmitted(true)
    const result = {
      score,
      submittedAt: new Date().toISOString(),
    }
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result))
    setLastResult(result)
  }

  const onReset = () => {
    setAnswers({})
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

      <section className={styles.questionList}>
        {questionSet.questions.map((question, index) => {
          const selected = answers[question.questionId]
          const isCorrect = selected === question.correctAnswer

          return (
            <article key={question.questionId} className={styles.questionCard}>
              <p className={styles.questionCategory}>{question.category}</p>
              <h2>
                Q{index + 1}. {question.statement}
              </h2>
              <div className={styles.answerButtons}>
                <button
                  type="button"
                  onClick={() => onChangeAnswer(question, 'true')}
                  className={selected === 'true' ? styles.selected : ''}
                >
                  正しい
                </button>
                <button
                  type="button"
                  onClick={() => onChangeAnswer(question, 'false')}
                  className={selected === 'false' ? styles.selected : ''}
                >
                  誤り
                </button>
              </div>

              {submitted && (
                <div className={styles.resultBox}>
                  <p className={isCorrect ? styles.correct : styles.incorrect}>
                    {isCorrect ? '✅ 正解' : '❌ 不正解'}
                  </p>
                  <p>{question.explanation}</p>
                </div>
              )}
            </article>
          )
        })}
      </section>

      <footer className={styles.footer}>
        <button
          type="button"
          onClick={onSubmit}
          className={styles.submitButton}
        >
          採点する
        </button>
        <button type="button" onClick={onReset} className={styles.resetButton}>
          回答をリセット
        </button>

        {submitted && (
          <p className={styles.summary}>
            結果: {score} / {questionSet.questionCount} 点（
            {isPassed ? '合格' : '不合格'}）
          </p>
        )}
      </footer>
    </main>
  )
}
