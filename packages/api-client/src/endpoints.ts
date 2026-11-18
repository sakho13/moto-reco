import type {
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
  ApiResponseUserAuthProviderSwitch,
  ApiResponseUserQuit,
  ApiResponseUserRecover,
  ApiResponseNotificationEmailVerify,
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
  ApiResponseUserGoodsDetail,
  ApiResponseUserGoodsList,
  ApiResponseGoodsManufacturer,
  SuccessResponse,
} from '@repo/shared-types'

/**
 * APIのエンドポイントと、HTTPメソッドごとのレスポンス型の対応表
 *
 * @remarks
 * Web とモバイルの両方から型付きで API を呼ぶために使う。
 * エンドポイントを追加・変更したときはここを更新すること。
 */
export type ApiEndpoints = {
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
  '/api/v1/user/auth/provider': {
    PUT: SuccessResponse<ApiResponseUserAuthProviderSwitch>
  }
  '/api/v1/user/auth/quit': {
    POST: SuccessResponse<ApiResponseUserQuit>
  }
  '/api/v1/user/auth/recover': {
    POST: SuccessResponse<ApiResponseUserRecover>
  }
  '/api/v1/user/notification-email/verify': {
    POST: SuccessResponse<ApiResponseNotificationEmailVerify>
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
  '/api/v1/user-goods': {
    GET: SuccessResponse<ApiResponseUserGoodsList>
    POST: SuccessResponse<ApiResponseUserGoodsDetail>
  }
  '/api/v1/goods/manufacturers': {
    GET: SuccessResponse<ApiResponseGoodsManufacturer>
  }
} & {
  [key: `/api/v1/user-goods/${string}`]: {
    GET: SuccessResponse<ApiResponseUserGoodsDetail>
    PATCH: SuccessResponse<ApiResponseUserGoodsDetail>
    DELETE: SuccessResponse<undefined>
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
  '/api/v1/mcp/oauth/authorize': {
    POST: SuccessResponse<{ redirectUrl: string }>
  }
}
