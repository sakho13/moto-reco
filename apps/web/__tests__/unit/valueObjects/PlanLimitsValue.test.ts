import { describe, expect, test } from 'vitest'
import { PlanLimitsValue } from '@/lib/api/server/valueObjects/PlanLimitsValue'
import { PLAN_LIMITS } from '@/lib/statics'

describe('PlanLimitsValue', () => {
  describe('from(plan)', () => {
    test('FREE: apiKey は PLAN_LIMITS.FREE.apiKey (= 1)', () => {
      const limits = PlanLimitsValue.from('FREE')
      expect(limits.apiKey).toBe(PLAN_LIMITS.FREE.apiKey)
    })

    test('PREMIUM: apiKey は null（無制限）', () => {
      const limits = PlanLimitsValue.from('PREMIUM')
      expect(limits.apiKey).toBeNull()
    })

    test('null（admin）: apiKey は null（無制限）', () => {
      const limits = PlanLimitsValue.from(null)
      expect(limits.apiKey).toBeNull()
    })

    test('plan 未指定: apiKey は null（デフォルト無制限）', () => {
      const limits = PlanLimitsValue.from()
      expect(limits.apiKey).toBeNull()
    })
  })

  describe('isOver()', () => {
    test("FREE: isOver('apiKey', 0) === false（上限未達）", () => {
      const limits = PlanLimitsValue.from('FREE')
      expect(limits.isOver('apiKey', 0)).toBe(false)
    })

    test("FREE: isOver('apiKey', 1) === true（count >= limit）", () => {
      const limits = PlanLimitsValue.from('FREE')
      expect(limits.isOver('apiKey', 1)).toBe(true)
    })

    test("PREMIUM: isOver('apiKey', 999) === false（null制限は常にfalse）", () => {
      const limits = PlanLimitsValue.from('PREMIUM')
      expect(limits.isOver('apiKey', 999)).toBe(false)
    })

    test("null（admin）: isOver('apiKey', 999) === false", () => {
      const limits = PlanLimitsValue.from(null)
      expect(limits.isOver('apiKey', 999)).toBe(false)
    })
  })

  describe('limitMessage()', () => {
    test('FREE の apiKey メッセージが返る', () => {
      const limits = PlanLimitsValue.from('FREE')
      const message = limits.limitMessage('apiKey')
      expect(message).toContain('無料プラン')
      expect(message).toContain('APIキー')
      expect(message).toContain(String(PLAN_LIMITS.FREE.apiKey))
    })

    test('PREMIUM の apiKey: フォールバックメッセージが返る', () => {
      const limits = PlanLimitsValue.from('PREMIUM')
      const message = limits.limitMessage('apiKey')
      expect(message).toBe('利用上限に達しました')
    })

    test('null（admin）の apiKey: フォールバックメッセージが返る', () => {
      const limits = PlanLimitsValue.from(null)
      const message = limits.limitMessage('apiKey')
      expect(message).toBe('利用上限に達しました')
    })
  })
})
