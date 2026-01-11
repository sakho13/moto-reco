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

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: '無料プラン',
    price: '¥0',
    period: '永久無料',
    description:
      'バイクの基本的なメンテナンス管理に必要な機能をすべて無料で利用できます。',
    features: [
      'バイク登録(2台まで)',
      '給油記録と燃費計算',
      'メンテナンス履歴管理',
      'メンテナンス通知',
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
      'より高度な分析機能とカスタマイズオプションを提供予定です。詳細は近日公開します。',
    features: [
      '無料プランの全機能',
      '無制限のバイク登録',
      '高度な燃費分析',
      'CSVエクスポート',
      'プレミアムサポート',
      '優先的な新機能アクセス',
    ],
    isComingSoon: true,
    ctaLabel: '準備中',
    ctaHref: '#',
    isPopular: true,
  },
]
