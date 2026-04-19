import { describe, expect, test } from 'vitest'
import { app } from '@/lib/api/server/app'

describe('Public API Endpoints', () => {
  describe('GET /api/v1/public/moped-test/questions', () => {
    test('原付学科試験の問題セットを取得できる', async () => {
      const res = await app.request('/api/v1/public/moped-test/questions', {
        method: 'GET',
      })

      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('原付学科試験の問題取得成功')
      expect(json.data.title).toBe('原付学科試験 練習問題')
      expect(json.data.questionCount).toBeGreaterThan(0)
      expect(json.data.questions.length).toBe(json.data.questionCount)
      expect(json.data.questions[0]).toMatchObject({
        questionId: expect.any(String),
        statement: expect.any(String),
        category: expect.any(String),
        correctAnswer: expect.stringMatching(/^(true|false)$/),
        explanation: expect.any(String),
      })
    })
  })
})
