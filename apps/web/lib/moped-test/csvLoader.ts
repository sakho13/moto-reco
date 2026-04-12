import { readFileSync } from 'fs'
import { join } from 'path'
import type { ApiResponseMopedTestQuestion } from '@repo/shared-types'

/**
 * ダブルクォート囲みを考慮したシンプルなCSV行パーサー
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // エスケープされた "" をスキップ
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

/**
 * Fisher-Yates アルゴリズムによる配列シャッフル
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j] as T
    arr[j] = tmp as T
  }
  return arr
}

/**
 * CSVから原付試験問題を読み込み、ランダムな順番で返す。
 * CSVの1行目はヘッダー行としてスキップする。
 * 列順: id, statement, correctAnswer(1=true/0=false), category, explanation, image_path
 */
export function loadMopedTestQuestions(): ApiResponseMopedTestQuestion[] {
  const filePath = join(process.cwd(), 'lib/moped-test/moptedTestData.csv')
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')

  // 1行目はヘッダーなのでスキップ
  const questions = lines.slice(1).map((line) => {
    const [
      id = '',
      statement = '',
      correctAnswerRaw = '0',
      category = '',
      explanation = '',
      imagePath = '',
    ] = parseCSVLine(line)
    const question: ApiResponseMopedTestQuestion = {
      questionId: id,
      statement,
      category,
      correctAnswer: correctAnswerRaw === '1' ? 'true' : 'false',
      explanation,
    }
    if (imagePath) question.imagePath = imagePath
    return question
  })

  return shuffle(questions)
}
