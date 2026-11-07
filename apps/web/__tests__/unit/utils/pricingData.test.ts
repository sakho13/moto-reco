import { describe, expect, test } from 'vitest'
import { AccountLimitsValue } from '@repo/shared-domain'
import {
  ACCOUNT_LIMITS,
  COMPARISON_ROWS,
  GUEST_ACCOUNT_TTL_DAYS,
  PRICING_PLANS,
  formatLimit,
  formatMcpAccess,
} from '@/app/(public)/pricing/pricingData'
import {
  FREE_USER_LIMITS,
  GUEST_ACCOUNT_LIMITS,
  PREMIUM_USER_LIMITS,
} from '@/lib/statics'

function findRow(feature: string) {
  const row = COMPARISON_ROWS.find((r) => r.feature === feature)
  if (!row) throw new Error(`比較表に「${feature}」の行がありません`)
  return row
}

describe('formatLimit', () => {
  test('数値は接尾辞を付けて表示する', () => {
    expect(formatLimit(2, '台まで')).toBe('2台まで')
  })

  test('null は無制限と表示する', () => {
    expect(formatLimit(null, '台まで')).toBe('無制限')
  })
})

describe('formatMcpAccess', () => {
  test('WRITE を含む場合は読み取り・書き込み', () => {
    expect(formatMcpAccess(['READ', 'WRITE'])).toBe('読み取り・書き込み')
  })

  test('READ のみの場合は読み取りのみ', () => {
    expect(formatMcpAccess(['READ'])).toBe('読み取りのみ')
  })

  test('スコープなしの場合は利用不可', () => {
    expect(formatMcpAccess([])).toBe('-')
  })
})

describe('ACCOUNT_LIMITS', () => {
  test('各列は対応するロール・プランの制限値と一致する', () => {
    expect(ACCOUNT_LIMITS.guest).toEqual(AccountLimitsValue.from('GUEST', null))
    expect(ACCOUNT_LIMITS.free).toEqual(AccountLimitsValue.from('USER', 'FREE'))
    expect(ACCOUNT_LIMITS.premium).toEqual(
      AccountLimitsValue.from('USER', 'PREMIUM')
    )
  })
})

describe('GUEST_ACCOUNT_TTL_DAYS', () => {
  test('ゲストアカウントの有効期間を日数に換算する', () => {
    expect(GUEST_ACCOUNT_TTL_DAYS).toBe(7)
    expect(GUEST_ACCOUNT_TTL_DAYS * 24 * 60 * 60 * 1000).toBe(
      GUEST_ACCOUNT_LIMITS.TTL_MS
    )
  })
})

describe('COMPARISON_ROWS', () => {
  test('バイク登録は各プランの上限台数を表示する', () => {
    expect(findRow('バイク登録')).toEqual({
      feature: 'バイク登録',
      guest: `${GUEST_ACCOUNT_LIMITS.BIKE}台まで`,
      free: `${FREE_USER_LIMITS.BIKE}台まで`,
      premium: `${PREMIUM_USER_LIMITS.BIKE}台まで`,
    })
  })

  test('メンテナンス記録は GUEST の上限件数を表示し FREE・PREMIUM は無制限', () => {
    expect(findRow('メンテナンス記録')).toEqual({
      feature: 'メンテナンス記録',
      guest: `${GUEST_ACCOUNT_LIMITS.MAINTENANCE_LOG}件まで / 台`,
      free: '無制限',
      premium: '無制限',
    })
  })

  test('ツーリングプランは FREE の上限件数を表示し PREMIUM は無制限', () => {
    expect(findRow('ツーリングプラン')).toEqual({
      feature: 'ツーリングプラン',
      guest: `${GUEST_ACCOUNT_LIMITS.TOURING_PLAN}件まで / 台`,
      free: `${FREE_USER_LIMITS.TOURING_PLAN}件まで / 台`,
      premium: '無制限',
    })
  })

  test('MCP連携はゲスト不可・FREE は読み取りのみ・PREMIUM は書き込み可', () => {
    expect(findRow('MCP連携（AIアシスタント）')).toEqual({
      feature: 'MCP連携（AIアシスタント）',
      guest: '-',
      free: '読み取りのみ',
      premium: '読み取り・書き込み',
    })
  })

  test('未実装のメンテナンス通知は表示しない', () => {
    expect(COMPARISON_ROWS.some((r) => r.feature === 'メンテナンス通知')).toBe(
      false
    )
  })
})

describe('FAQで件数の制限なしと案内している項目', () => {
  test('FREE の給油履歴・メンテナンス記録・ツーリング記録・購入グッズは無制限', () => {
    expect(ACCOUNT_LIMITS.free.fuelLog).toBeNull()
    expect(ACCOUNT_LIMITS.free.maintenanceLog).toBeNull()
    expect(ACCOUNT_LIMITS.free.touring).toBeNull()
    expect(ACCOUNT_LIMITS.free.goods).toBeNull()
  })
})

describe('PRICING_PLANS', () => {
  test('プレミアムプランのバイク登録は上限台数を表示する', () => {
    const premium = PRICING_PLANS.find((p) => p.id === 'premium')
    expect(premium?.features).toContain(
      `バイク登録(${PREMIUM_USER_LIMITS.BIKE}台まで)`
    )
  })

  test('未実装の機能を掲載しない', () => {
    const features = PRICING_PLANS.flatMap((p) => p.features)
    for (const unimplemented of [
      'メンテナンス通知',
      '無制限のバイク登録',
      '高度な燃費分析',
      'CSVエクスポート',
      'プレミアムサポート',
      '優先的な新機能アクセス',
    ]) {
      expect(features).not.toContain(unimplemented)
    }
  })
})
