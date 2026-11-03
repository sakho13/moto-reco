import {
  AccountLimitsValue,
  GUEST_ACCOUNT_LIMITS,
  type LimitKey,
} from '@repo/shared-domain'
import type { ApiKeyScope } from '@repo/shared-types'

export interface PricingPlan {
  id: string
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  isComingSoon: boolean
  ctaLabel: string
  ctaHref: string
  badge?: string
  isPopular?: boolean
}

/**
 * 比較表の列ごとの制限値
 */
export const ACCOUNT_LIMITS = {
  guest: AccountLimitsValue.from('GUEST', null),
  free: AccountLimitsValue.from('USER', 'FREE'),
  premium: AccountLimitsValue.from('USER', 'PREMIUM'),
} as const

/** ゲストアカウントの有効日数 */
export const GUEST_ACCOUNT_TTL_DAYS =
  GUEST_ACCOUNT_LIMITS.TTL_MS / (24 * 60 * 60 * 1000)

type PlanColumn = keyof typeof ACCOUNT_LIMITS

export type ComparisonRow = { feature: string } & Record<PlanColumn, string>

/**
 * 制限値を表示用の文字列にする（null は無制限）
 */
export function formatLimit(limit: number | null, suffix: string): string {
  return limit === null ? '無制限' : `${limit}${suffix}`
}

/**
 * 許可スコープからMCP連携の利用範囲を表示用の文字列にする
 */
export function formatMcpAccess(scopes: ApiKeyScope[]): string {
  if (scopes.includes('WRITE')) return '読み取り・書き込み'
  if (scopes.includes('READ')) return '読み取りのみ'
  return '-'
}

function buildLimitRow(
  feature: string,
  key: LimitKey,
  suffix: string
): ComparisonRow {
  return {
    feature,
    guest: formatLimit(ACCOUNT_LIMITS.guest[key], suffix),
    free: formatLimit(ACCOUNT_LIMITS.free[key], suffix),
    premium: formatLimit(ACCOUNT_LIMITS.premium[key], suffix),
  }
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  buildLimitRow('バイク登録', 'bike', '台まで'),
  buildLimitRow('給油履歴', 'fuelLog', '件まで / 台'),
  buildLimitRow('ツーリング記録', 'touring', '件まで / 台'),
  buildLimitRow('ツーリングプラン', 'touringPlan', '件まで / 台'),
  buildLimitRow('メンテナンス記録', 'maintenanceLog', '件まで / 台'),
  buildLimitRow('購入グッズ登録', 'goods', '件まで'),
  {
    feature: 'MCP連携（AIアシスタント）',
    guest: formatMcpAccess(ACCOUNT_LIMITS.guest.allowedScopes),
    free: formatMcpAccess(ACCOUNT_LIMITS.free.allowedScopes),
    premium: formatMcpAccess(ACCOUNT_LIMITS.premium.allowedScopes),
  },
  { feature: 'データ自動バックアップ', guest: '○', free: '○', premium: '○' },
  { feature: 'マルチデバイス同期', guest: '○', free: '○', premium: '○' },
]

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: '無料プラン',
    price: '¥0',
    period: '永久無料',
    description:
      'バイクの基本的なメンテナンス管理に必要な機能をすべて無料で利用できます。',
    features: [
      `バイク登録(${formatLimit(ACCOUNT_LIMITS.free.bike, '台まで')})`,
      '給油記録と燃費計算',
      `メンテナンス記録(${formatLimit(ACCOUNT_LIMITS.free.maintenanceLog, '件まで / 台')})`,
      'ツーリング記録',
      `ツーリングプラン(${formatLimit(ACCOUNT_LIMITS.free.touringPlan, '件まで / 台')})`,
      `MCP連携(${formatMcpAccess(ACCOUNT_LIMITS.free.allowedScopes)})`,
      'データ自動バックアップ',
      'マルチデバイス同期',
    ],
    isComingSoon: false,
    ctaLabel: '無料で始める',
    ctaHref: `/app/login`,
    badge: '現在利用可能',
  },
  {
    id: 'premium',
    name: 'プレミアムプラン',
    price: '準備中',
    description:
      'より多くのバイクと記録を管理でき、AIアシスタントからツーリングプランを作成・編集できるプランを提供予定です。料金と提供開始時期は近日公開します。',
    features: [
      '無料プランの全機能',
      `バイク登録(${formatLimit(ACCOUNT_LIMITS.premium.bike, '台まで')})`,
      `メンテナンス記録(${formatLimit(ACCOUNT_LIMITS.premium.maintenanceLog, '件まで / 台')})`,
      `ツーリングプラン(${formatLimit(ACCOUNT_LIMITS.premium.touringPlan, '件まで / 台')})`,
      `MCP連携(${formatMcpAccess(ACCOUNT_LIMITS.premium.allowedScopes)})`,
    ],
    isComingSoon: true,
    ctaLabel: '準備中',
    ctaHref: '#',
    isPopular: true,
  },
]
