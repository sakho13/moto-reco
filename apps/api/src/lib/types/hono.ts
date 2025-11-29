import { UserId } from '@shared-types/index'

// Honoアプリケーション全体で使用する変数の型定義
export type HonoVariables = {
  user?: {
    // 内部User ID（MUser.id）
    userId: UserId

    // 認証情報
    email?: string
    emailVerified?: boolean
    providerType: string
  }
}
