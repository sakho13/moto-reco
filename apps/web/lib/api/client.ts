import {
  ApiResponseUserProfile,
  ApiResponseUserPlanHistory,
  ApiResponseManufacturer,
  ApiResponseUserBikeList,
  ApiResponseUserBikeDetail,
  ApiResponseUserBikeRegister,
  ApiResponseFuelLogDetail,
  ApiResponseFuelLogList,
  ApiResponseMaintenanceLogDetail,
  ApiResponseMaintenanceLogList,
  ApiResponseUserQuit,
  ApiResponsePublicUserPage,
  ApiResponseUserFollowList,
  ApiResponseUserSearch,
  ApiResponseFuelInsight,
  ApiResponseTouringDetail,
  ApiResponseTouringList,
  ApiResponseOngoingTouring,
  ApiResponseBikesOngoingTourings,
  ApiResponseSpotDetail,
  ApiResponseSpotList,
  ApiResponseTouringPlanDetail,
  ApiResponseTouringPlanList,
  ApiResponseTouringPlanLocation,
  ApiResponseTouringPlanSpotDetail,
  ApiResponseTouringPlanSpotList,
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
    PATCH: SuccessResponse<ApiResponseUserProfile>
  }
  '/api/v1/user/plan/histories': {
    GET: SuccessResponse<ApiResponseUserPlanHistory>
  }
  '/api/v1/user/auth/register': {
    POST: SuccessResponse<ApiResponseUserProfile>
  }
  '/api/v1/user/auth/quit': {
    POST: SuccessResponse<ApiResponseUserQuit>
  }
  '/api/v1/user/auth/guest/register': {
    POST: SuccessResponse<ApiResponseUserProfile>
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
  '/api/v1/user/search': {
    GET: SuccessResponse<ApiResponseUserSearch>
  }
} & {
  [key: `/api/v1/user/${string}/page`]: {
    GET: SuccessResponse<ApiResponsePublicUserPage>
  }
} & {
  [key: `/api/v1/user/${string}/follow`]: {
    POST: SuccessResponse<Record<string, never>>
    DELETE: SuccessResponse<Record<string, never>>
  }
} & {
  [key: `/api/v1/user/${string}/followers`]: {
    GET: SuccessResponse<ApiResponseUserFollowList>
  }
} & {
  [key: `/api/v1/user/${string}/following`]: {
    GET: SuccessResponse<ApiResponseUserFollowList>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/fuel-logs`]: {
    GET: SuccessResponse<ApiResponseFuelLogList>
    POST: SuccessResponse<ApiResponseFuelLogDetail>
    PATCH: SuccessResponse<ApiResponseFuelLogDetail>
    DELETE: SuccessResponse<undefined>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/maintenance-logs`]: {
    GET: SuccessResponse<ApiResponseMaintenanceLogList>
    POST: SuccessResponse<ApiResponseMaintenanceLogDetail>
    PATCH: SuccessResponse<ApiResponseMaintenanceLogDetail>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/fuel-insights`]: {
    GET: SuccessResponse<ApiResponseFuelInsight>
  }
  [key: `/api/v1/user-bike/bike/${string}/tourings`]: {
    GET: SuccessResponse<ApiResponseTouringList>
    POST: SuccessResponse<ApiResponseTouringDetail>
    DELETE: SuccessResponse<undefined>
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
  [key: `/api/v1/user-bike/bike/${string}/tourings/${string}/spots`]: {
    GET: SuccessResponse<ApiResponseSpotList>
    POST: SuccessResponse<ApiResponseSpotDetail>
  }
} & {
  [
    key: `/api/v1/user-bike/bike/${string}/tourings/${string}/spots/${string}`
  ]: {
    PATCH: SuccessResponse<ApiResponseSpotDetail>
    DELETE: SuccessResponse<undefined>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}`]: {
    GET: SuccessResponse<ApiResponseUserBikeDetail>
    PATCH: SuccessResponse<ApiResponseUserBikeDetail>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/touring-plans`]: {
    GET: SuccessResponse<ApiResponseTouringPlanList>
    POST: SuccessResponse<ApiResponseTouringPlanDetail>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/touring-plans/${string}`]: {
    GET: SuccessResponse<ApiResponseTouringPlanDetail>
    PATCH: SuccessResponse<ApiResponseTouringPlanDetail>
    DELETE: SuccessResponse<undefined>
  }
} & {
  [
    key: `/api/v1/user-bike/bike/${string}/touring-plans/${string}/start-location`
  ]: {
    PATCH: SuccessResponse<ApiResponseTouringPlanLocation | null>
  }
} & {
  [
    key: `/api/v1/user-bike/bike/${string}/touring-plans/${string}/destination-location`
  ]: {
    PATCH: SuccessResponse<ApiResponseTouringPlanLocation | null>
  }
} & {
  [key: `/api/v1/user-bike/bike/${string}/touring-plans/${string}/spots`]: {
    GET: SuccessResponse<ApiResponseTouringPlanSpotList>
    POST: SuccessResponse<ApiResponseTouringPlanSpotDetail>
  }
} & {
  [
    key: `/api/v1/user-bike/bike/${string}/touring-plans/${string}/spots/reorder`
  ]: {
    PATCH: SuccessResponse<undefined>
  }
} & {
  [
    key: `/api/v1/user-bike/bike/${string}/touring-plans/${string}/spots/${string}`
  ]: {
    PATCH: SuccessResponse<ApiResponseTouringPlanSpotDetail>
    DELETE: SuccessResponse<undefined>
  }
} & {
  '/api/v1/mcp/api-keys': {
    GET: SuccessResponse<{
      apiKeys: {
        apiKeyId: string
        name: string
        prefix: string
        createdAt: string
      }[]
    }>
    POST: SuccessResponse<{
      apiKeyId: string
      name: string
      prefix: string
      fullKey: string
      createdAt: string
    }>
  }
} & {
  [key: `/api/v1/mcp/api-keys/${string}/revoke`]: {
    PATCH: SuccessResponse<null>
  }
} & {
  [key: `/api/v1/mcp/api-keys/${string}`]: {
    DELETE: SuccessResponse<null>
  }
}
