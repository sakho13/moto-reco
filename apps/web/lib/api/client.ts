import { createApiClient } from '@repo/api-client'
import { getFirebaseAuth } from '../firebase/config'

/**
 * Web 用の API クライアント
 *
 * @remarks
 * 同じオリジンの API を呼ぶため `baseUrl` は空文字。IDトークンは Firebase の
 * 認証状態の復元を待ってから取得する（リロード直後に未ログイン扱いにしないため）。
 */
const apiClient = createApiClient({
  baseUrl: '',
  getIdToken: async () => {
    const auth = getFirebaseAuth()
    await auth.authStateReady()
    const user = auth.currentUser
    return user ? user.getIdToken() : null
  },
})

export const {
  /** 認証付きAPIリクエスト（レスポンスはそのまま返す） */
  authenticatedFetch,
  /** 認証付きGETリクエスト */
  apiGet,
  /** 未認証（公開）POSTリクエスト */
  apiPostPublic,
  /** 認証付きPOSTリクエスト */
  apiPost,
  /** 認証付きPUTリクエスト */
  apiPut,
  /** 認証付きPATCHリクエスト */
  apiPatch,
  /** 認証付きDELETEリクエスト */
  apiDelete,
} = apiClient
