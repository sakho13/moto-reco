import { describe, expect, test } from 'vitest'
import { AccountLimitsValue } from '@repo/shared-domain'
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

    test('maintenanceLog は GUEST_ACCOUNT_LIMITS.MAINTENANCE_LOG', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.maintenanceLog).toBe(GUEST_ACCOUNT_LIMITS.MAINTENANCE_LOG)
    })

    test('canUse(hostEvent) は false（イベント開催不可）', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.canUse('hostEvent')).toBe(false)
    })

    test('featureDeniedMessage(hostEvent) はプレミアムプランへの案内', () => {
      const limits = AccountLimitsValue.from('GUEST', null)
      expect(limits.featureDeniedMessage('hostEvent')).toBe(
        'イベントの開催はプレミアムプランで利用できます'
      )
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

    test('maintenanceLog は null（無制限）', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.maintenanceLog).toBeNull()
    })

    test('isOver(maintenanceLog, 999) は false', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.isOver('maintenanceLog', 999)).toBe(false)
    })

    test('touringPlan は FREE_USER_LIMITS.TOURING_PLAN', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.touringPlan).toBe(FREE_USER_LIMITS.TOURING_PLAN)
    })

    test('canUse(hostEvent) は false（イベント開催不可）', () => {
      const limits = AccountLimitsValue.from('USER', 'FREE')
      expect(limits.canUse('hostEvent')).toBe(false)
    })

    test('plan が null の USER は FREE と同じ扱い', () => {
      const limits = AccountLimitsValue.from('USER', null)
      expect(limits.bike).toBe(FREE_USER_LIMITS.BIKE)
      expect(limits.maintenanceLog).toBeNull()
      expect(limits.canUse('hostEvent')).toBe(false)
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

    test('maintenanceLog は null（無制限）', () => {
      const limits = AccountLimitsValue.from('USER', 'PREMIUM')
      expect(limits.maintenanceLog).toBeNull()
    })

    test('canUse(hostEvent) は true（イベント開催可）', () => {
      const limits = AccountLimitsValue.from('USER', 'PREMIUM')
      expect(limits.canUse('hostEvent')).toBe(true)
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

    test('canUse(hostEvent) は true（イベント開催可）', () => {
      const limits = AccountLimitsValue.from('ADMIN', null)
      expect(limits.canUse('hostEvent')).toBe(true)
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
