import { UserId } from './user'

export const ProviderTypeMap = {
  FIREBASE_EMAIL: 'FIREBASE_EMAIL',
  FIREBASE_GOOGLE: 'FIREBASE_GOOGLE',
  FIREBASE_ANONYMOUS: 'FIREBASE_ANONYMOUS',
} as const

export type ProviderType =
  (typeof ProviderTypeMap)[keyof typeof ProviderTypeMap]

/**
 * 同一の Firebase UID で1ユーザーに紐付けられる認証方式
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
