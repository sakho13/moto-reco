import { ApiV1Error } from '@repo/shared-domain'
import type { ErrorResponse } from '@repo/shared-types'
import type { ApiEndpoints } from './endpoints'

/** エンドポイント `U` に `M` メソッドがあれば、そのレスポンス型 */
type ResponseOf<U extends keyof ApiEndpoints, M extends string> =
  ApiEndpoints[U] extends Record<M, unknown> ? ApiEndpoints[U][M] : never

/**
 * {@link createApiClient} の設定
 */
export type ApiClientConfig = {
  /**
   * リクエスト先の先頭に付けるURL
   *
   * @remarks
   * Web は同じオリジンの API を呼ぶため空文字、モバイルは API サーバーのURL
   * （例: `https://example.com`）を渡す。末尾のスラッシュは付けない。
   */
  baseUrl: string
  /**
   * ログイン中ユーザーの Firebase IDトークンを返す
   *
   * @remarks
   * 未ログインなら null を返す。認証状態の復元を待つ必要がある場合は、
   * この関数の中で待つこと。
   */
  getIdToken: () => Promise<string | null>
}

/**
 * {@link createApiClient} が返す API 呼び出し関数の集まり
 */
export type ApiClient = {
  /** IDトークンを付けて fetch する（レスポンスはそのまま返す） */
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>
  apiGet: <U extends keyof ApiEndpoints>(
    url: U
  ) => Promise<ResponseOf<U, 'GET'>>
  apiPostPublic: <U extends keyof ApiEndpoints>(
    url: U,
    data: unknown
  ) => Promise<ResponseOf<U, 'POST'>>
  apiPost: <U extends keyof ApiEndpoints>(
    url: U,
    data: unknown
  ) => Promise<ResponseOf<U, 'POST'>>
  apiPut: <U extends keyof ApiEndpoints>(
    url: U,
    data: unknown
  ) => Promise<ResponseOf<U, 'PUT'>>
  apiPatch: <U extends keyof ApiEndpoints>(
    url: U,
    data: unknown
  ) => Promise<ResponseOf<U, 'PATCH'>>
  apiDelete: <U extends keyof ApiEndpoints>(
    url: U,
    data?: unknown
  ) => Promise<ResponseOf<U, 'DELETE'>>
}

/**
 * エラーレスポンスかどうかを判定する型ガード
 */
export function isErrorResponse(json: unknown): json is ErrorResponse {
  return (
    typeof json === 'object' &&
    json !== null &&
    'status' in json &&
    json.status === 'error' &&
    'errorCode' in json &&
    'message' in json
  )
}

/**
 * APIレスポンスを処理し、エラー時には ApiV1Error をスローする
 *
 * @throws {ApiV1Error} HTTPエラーまたはレスポンスボディがエラーの場合
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  // 1. JSON パースを try-catch で保護
  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new ApiV1Error(
      'SERVER_ERROR',
      `レスポンスのパースに失敗しました: ${response.status} ${response.statusText}`
    )
  }

  // 2. エラーチェック (HTTPステータス OR レスポンスボディのstatus)
  if (!response.ok || isErrorResponse(json)) {
    const errorBody = isErrorResponse(json) ? json : null
    throw new ApiV1Error(
      errorBody?.errorCode ?? 'SERVER_ERROR',
      errorBody?.message ?? `HTTP ${response.status}: ${response.statusText}`,
      errorBody?.details
    )
  }

  // 3. 成功レスポンスを返す
  return json as T
}

/**
 * API クライアントを作る
 *
 * @remarks
 * IDトークンの取得方法とリクエスト先を外から受け取るため、Firebase の SDK や
 * 実行環境（Next.js / React Native）に依存しない。
 *
 * @example
 * ```ts
 * const { apiGet } = createApiClient({
 *   baseUrl: 'https://example.com',
 *   getIdToken: async () => auth.currentUser?.getIdToken() ?? null,
 * })
 * const profile = await apiGet('/api/v1/user/profile')
 * ```
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, getIdToken } = config

  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getIdToken()
    if (!token) {
      throw new Error('認証されていません')
    }

    return fetch(`${baseUrl}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  const requestWithBody = async <T>(
    method: 'POST' | 'PUT' | 'PATCH',
    url: string,
    data: unknown
  ): Promise<T> => {
    const response = await authenticatedFetch(url, {
      method,
      body: JSON.stringify(data),
    })
    return handleApiResponse<T>(response)
  }

  return {
    authenticatedFetch,

    apiGet: async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      return handleApiResponse(response)
    },

    // `Authorization` ヘッダーを付与しない。復帰APIなど、ログイン前に呼び出す
    // 必要がある公開エンドポイント専用。
    apiPostPublic: async (url, data) => {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return handleApiResponse(response)
    },

    apiPost: (url, data) => requestWithBody('POST', url, data),
    apiPut: (url, data) => requestWithBody('PUT', url, data),
    apiPatch: (url, data) => requestWithBody('PATCH', url, data),

    apiDelete: async (url, data) => {
      const response = await authenticatedFetch(url, {
        method: 'DELETE',
        body: data ? JSON.stringify(data) : undefined,
      })
      return handleApiResponse(response)
    },
  }
}
