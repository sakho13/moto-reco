import {
  ApiResponseUserProfile,
  ApiResponseManufacturer,
  ApiResponseUserBikeList,
  ApiResponseUserBikeDetail,
  ApiResponseUserBikeRegister,
  ApiResponseFuelLogDetail,
  ApiResponseFuelLogList,
  ApiResponseUserQuit,
  ApiResponseFuelInsight,
  ApiResponseTouringDetail,
  ApiResponseTouringList,
  ApiResponseOngoingTouring,
  ApiResponseBikesOngoingTourings,
  ErrorResponse,
  SuccessResponse,
} from '@repo/shared-types'
import { getFirebaseAuth } from '../firebase/config'
import { ApiV1Error } from './server/errors/ApiV1Error'

/**
 * 認証付きAPIリクエスト
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const auth = getFirebaseAuth()
  const user = auth.currentUser

  if (!user) {
    throw new Error('認証されていません')
  }

  const token = await user.getIdToken()

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * エラーレスポンスかどうかを判定する型ガード
 */
function isErrorResponse(json: unknown): json is ErrorResponse {
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
async function handleApiResponse<T>(response: Response): Promise<T> {
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
 * 認証付きGETリクエスト
 *
 * @throws {ApiV1Error} APIエラーが発生した場合
 */
export const apiGet = async <U extends keyof API_EP>(
  url: U
): Promise<API_EP[U] extends { GET: unknown } ? API_EP[U]['GET'] : never> => {
  const response = await authenticatedFetch(url, { method: 'GET' })
  return handleApiResponse(response)
}

/**
 * 認証付きPOSTリクエスト
 *
 * @throws {ApiV1Error} APIエラーが発生した場合
 */
export const apiPost = async <U extends keyof API_EP>(
  url: U,
  data: unknown
): Promise<API_EP[U] extends { POST: unknown } ? API_EP[U]['POST'] : never> => {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return handleApiResponse(response)
}

/**
 * 認証付きPUTリクエスト
 *
 * @throws {ApiV1Error} APIエラーが発生した場合
 */
export const apiPut = async <U extends keyof API_EP>(
  url: U,
  data: unknown
): Promise<API_EP[U] extends { PUT: unknown } ? API_EP[U]['PUT'] : never> => {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return handleApiResponse(response)
}

/**
 * 認証付きPATCHリクエスト
 *
 * @throws {ApiV1Error} APIエラーが発生した場合
 */
export const apiPatch = async <U extends keyof API_EP>(
  url: U,
  data: unknown
): Promise<
  API_EP[U] extends { PATCH: unknown } ? API_EP[U]['PATCH'] : never
> => {
  const response = await authenticatedFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return handleApiResponse(response)
}

/**
 * 認証付きDELETEリクエスト
 *
 * @throws {ApiV1Error} APIエラーが発生した場合
 */
export const apiDelete = async <U extends keyof API_EP>(
  url: U,
  data?: unknown
): Promise<
  API_EP[U] extends { DELETE: unknown } ? API_EP[U]['DELETE'] : never
> => {
  const response = await authenticatedFetch(url, {
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  })
  return handleApiResponse(response)
}

type API_EP = {
  '/api/v1/user/profile': {
    GET: SuccessResponse<ApiResponseUserProfile>
    POST: SuccessResponse<ApiResponseUserProfile>
  }
  '/api/v1/user/auth/register': {
    POST: SuccessResponse<ApiResponseUserProfile>
  }
  '/api/v1/user/auth/quit': {
    POST: SuccessResponse<ApiResponseUserQuit>
  }
  '/api/v1/bikes/manufacturers': {
    GET: SuccessResponse<ApiResponseManufacturer>
  }
  '/api/v1/user-bike/bikes': {
    GET: SuccessResponse<ApiResponseUserBikeList>
  }
  '/api/v1/user-bike/bikes/ongoing-tourings': {
    GET: SuccessResponse<ApiResponseBikesOngoingTourings>
  }
  '/api/v1/user-bike/register': {
    POST: SuccessResponse<ApiResponseUserBikeRegister>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/fuel-logs`]: {
    GET: SuccessResponse<ApiResponseFuelLogList>
    POST: SuccessResponse<ApiResponseFuelLogDetail>
    PATCH: SuccessResponse<ApiResponseFuelLogDetail>
    DELETE: SuccessResponse<undefined>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/fuel-insights`]: {
    GET: SuccessResponse<ApiResponseFuelInsight>
  }
  [key: `/api/v1/user-bike/bike/${string}/tourings`]: {
    GET: SuccessResponse<ApiResponseTouringList>
    POST: SuccessResponse<ApiResponseTouringDetail>
  }
  [key: `/api/v1/user-bike/bike/${string}/tourings/start-end`]: {
    POST: SuccessResponse<ApiResponseTouringDetail>
  }
  [key: `/api/v1/user-bike/bike/${string}/tourings/ongoing`]: {
    GET: SuccessResponse<ApiResponseOngoingTouring>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/tourings/${string}`]: {
    GET: SuccessResponse<ApiResponseTouringDetail>
    PATCH: SuccessResponse<ApiResponseTouringDetail>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}`]: {
    GET: SuccessResponse<ApiResponseUserBikeDetail>
    PATCH: SuccessResponse<ApiResponseUserBikeDetail>
  }
}
