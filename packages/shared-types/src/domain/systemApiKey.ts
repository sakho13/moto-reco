/**
 * システム共通APIキー（内部バッチAPI等の保護用）
 *
 * @remarks
 * 特定ユーザーには紐づかない。管理者専用API/UIで発行・失効を行う。
 */
export type SystemApiKeyId = string & { readonly brand: unique symbol }
export const createSystemApiKeyId = (id: string): SystemApiKeyId =>
  id as SystemApiKeyId

export type SystemApiKey = {
  id: SystemApiKeyId
  name: string
  keyHash: string
  prefix: string
  isActive: boolean
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
