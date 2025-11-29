import { UserId } from './user.js'

export const ProviderTypeMap = {
  FIREBASE_EMAIL: 'FIREBASE_EMAIL',
  FIREBASE_GOOGLE: 'FIREBASE_GOOGLE',
} as const

export type ProviderType =
  (typeof ProviderTypeMap)[keyof typeof ProviderTypeMap]

export type AuthProvider = {
  userId: UserId
  externalId: string
  providerType: ProviderType
  isActive: boolean
  metadata?: Record<string, unknown>
}
