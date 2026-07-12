import { describe, expect, test } from 'vitest'
import { AccountLimitsValue } from '@/lib/api/server/valueObjects/AccountLimitsValue'
import {
  FREE_USER_LIMITS,
  GUEST_ACCOUNT_LIMITS,
  PLAN_ALLOWED_SCOPES,
  PLAN_LIMITS,
  PREMIUM_USER_LIMITS,
} from '@/lib/statics'

describe('AccountLimitsValue', () => {
  describe('GUEST ロール', () => {
    test('bike は GUEST_ACCOUNT_LIMITS.BIKE', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.bike).toBe(GUEST_ACCOUNT_LIMITS.BIKE)
    })

    test('fuelLog は GUEST_ACCOUNT_LIMITS.FUEL_LOG', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.fuelLog).toBe(GUEST_ACCOUNT_LIMITS.FUEL_LOG)
    })

    test('apiKey は 0（発行不可）', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.apiKey).toBe(0)
    })

    test('allowedScopes は []（スコープなし）', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.allowedScopes).toEqual([])
    })

    test('isOver(apiKey, 0) は true', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.isOver('apiKey', 0)).toBe(true)
    })

    test('limitMessage(apiKey) はゲスト向けメッセージ', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.limitMessage('apiKey')).toBe(
        'ゲストアカウントはAPIキーを発行できません'
      )
    })
  })

  describe('USER ロール / FREE プラン', () => {
    test('bike は FREE_USER_LIMITS.BIKE', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.bike).toBe(FREE_USER_LIMITS.BIKE)
    })

    test('apiKey は PLAN_LIMITS.FREE.apiKey (= 1)', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.apiKey).toBe(PLAN_LIMITS.FREE.apiKey)
    })

    test('allowedScopes は PLAN_ALLOWED_SCOPES.FREE', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.allowedScopes).toEqual(PLAN_ALLOWED_SCOPES.FREE)
    })

    test('isOver(apiKey, 0) は false（未達）', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.isOver('apiKey', 0)).toBe(false)
    })

    test('isOver(apiKey, 1) は true（上限到達）', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.isOver('apiKey', 1)).toBe(true)
    })

    test('limitMessage(apiKey) は無料プラン向けメッセージ', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      const msg = limits.limitMessage('apiKey')
      expect(msg).toContain('無料プラン')
      expect(msg).toContain('APIキー')
      expect(msg).toContain(String(PLAN_LIMITS.FREE.apiKey))
    })
  })

  describe('USER ロール / PREMIUM プラン', () => {
    test('bike は PREMIUM_USER_LIMITS.BIKE', () => {
      const limits = AccountLimitsValue.from('USER', 'PREMIUM')
      expect(limits.bike).toBe(PREMIUM_USER_LIMITS.BIKE)
    })

    test('apiKey は null（無制限）', () => {
      const limits = AccountLimitsValue.from('USER', 'PREMIUM')
      expect(limits.apiKey).toBeNull()
    })

    test('allowedScopes は PLAN_ALLOWED_SCOPES.PREMIUM', () => {
      const limits = AccountLimitsValue.from('USER', 'PREMIUM')
      expect(limits.allowedScopes).toEqual(PLAN_ALLOWED_SCOPES.PREMIUM)
    })

    test('isOver(apiKey, 999) は false（null制限は常に false）', () => {
      const limits = AccountLimitsValue.from('USER', 'PREMIUM')
      expect(limits.isOver('apiKey', 999)).toBe(false)
    })
  })

  describe('ADMIN ロール', () => {
    test('bike は null（無制限）', () => {
      const limits = AccountLimitsValue.from('ADMIN', null)
      expect(limits.bike).toBeNull()
    })

    test('apiKey は null（無制限）', () => {
      const limits = AccountLimitsValue.from('ADMIN', null)
      expect(limits.apiKey).toBeNull()
    })

    test('allowedScopes は全スコープ', () => {
      const limits = AccountLimitsValue.from('ADMIN', null)
      expect(limits.allowedScopes).toEqual(['READ', 'WRITE'])
    })

    test('isOver(apiKey, 999) は false', () => {
      const limits = AccountLimitsValue.from('ADMIN', null)
      expect(limits.isOver('apiKey', 999)).toBe(false)
    })
  })
})
