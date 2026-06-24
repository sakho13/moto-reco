import { UserId, UserPlan } from '@repo/shared-types'

// Honoアプリケーション全体で使用する変数の型定義
export type HonoVariables = {
  user?: {
    // 内部User ID（MUser.id）
    userId: UserId

    // ユーザーロール
    role: 'USER' | 'ADMIN' | 'GUEST'

    // 料金プラン（USER ロールのみ。GUEST / ADMIN は null）
    plan: UserPlan | null

    // 認証情報
    email?: string
    emailVerified?: boolean
    providerType: string
  }
}
