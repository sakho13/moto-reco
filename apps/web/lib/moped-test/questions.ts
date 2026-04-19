import type { ApiResponseMopedTestQuestionSet } from '@repo/shared-types'
import { loadMopedTestQuestions } from './csvLoader'

/**
 * 原付学科試験の練習問題セットを取得する。
 * 問題はリクエストごとにランダムな順番で返される。
 */
export function getMopedTestQuestionSet(): ApiResponseMopedTestQuestionSet {
  const QUESTION_COUNT = 46
  const questions = loadMopedTestQuestions().slice(0, QUESTION_COUNT)
  return {
    title: '原付学科試験 練習問題',
    version: '2026-04-12',
    questionCount: questions.length,
    passScore: 42, // 46問 × 90% 切り上げ
    questions,
  }
}
