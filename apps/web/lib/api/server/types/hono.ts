import type { UserEntity } from '@repo/shared-domain'

// Honoアプリケーション全体で使用する変数の型定義
export type HonoVariables = {
  user?: {
    userEntity: UserEntity
    email?: string
    emailVerified?: boolean
    providerType: string
  }
}
