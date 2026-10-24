import { UserId } from './user'

export const ProviderTypeMap = {
  FIREBASE_EMAIL: 'FIREBASE_EMAIL',
  FIREBASE_GOOGLE: 'FIREBASE_GOOGLE',
  FIREBASE_ANONYMOUS: 'FIREBASE_ANONYMOUS',
} as const

export type ProviderType =
  (typeof ProviderTypeMap)[keyof typeof ProviderTypeMap]

/**
 * 切り替え可能な認証方式（Firebase UID で1ユーザーを特定する対象）
 */
export const FIREBASE_LINKABLE_PROVIDER_TYPES: readonly ProviderType[] = [
  ProviderTypeMap.FIREBASE_EMAIL,
  ProviderTypeMap.FIREBASE_GOOGLE,
]

export type AuthProvider = {
  userId: UserId
  externalId: string
  providerType: ProviderType
  isActive: boolean
  metadata?: Record<string, unknown>
}
