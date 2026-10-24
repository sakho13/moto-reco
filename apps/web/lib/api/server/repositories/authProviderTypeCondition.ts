import {
  FIREBASE_LINKABLE_PROVIDER_TYPES,
  type ProviderType,
} from '@repo/shared-types'

/**
 * MAuthProvider.providerType の検索条件を返す
 *
 * @remarks
 * 切り替え可能な認証方式（メール/Google）は、いずれの方式でも同じ外部IDの行に一致させる。
 */
export function toProviderTypeCondition(
  providerType: ProviderType
): ProviderType | { in: ProviderType[] } {
  return FIREBASE_LINKABLE_PROVIDER_TYPES.includes(providerType)
    ? { in: [...FIREBASE_LINKABLE_PROVIDER_TYPES] }
    : providerType
}
