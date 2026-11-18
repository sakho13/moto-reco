import { createApiClient } from '@repo/api-client'
import { ENV } from './env'
import { firebaseAuth } from './firebase'

/**
 * モバイル用の API クライアント
 *
 * @remarks
 * IDトークンは端末に保存されたログイン状態の復元を待ってから取得する
 * （起動直後に未ログイン扱いにしないため）。
 */
export const apiClient = createApiClient({
  baseUrl: ENV.apiBaseUrl,
  getIdToken: async () => {
    await firebaseAuth.authStateReady()
    const user = firebaseAuth.currentUser
    return user ? user.getIdToken() : null
  },
})
