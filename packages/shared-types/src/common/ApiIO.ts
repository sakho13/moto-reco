export type SuccessResponse<T> = {
  status: 'success'
  data: T
  message?: string
}

export type ErrorResponse<T = unknown> = {
  status: 'error'
  errorCode: ErrorCode
  message: string
  details?: T
}

export const ErrorCodeMap = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
  USER_NOT_REGISTERED: 'USER_NOT_REGISTERED',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodeMap

// エラーコードとHTTPステータスコードのマッピング
export const ErrorCodeToHttpStatus = {
  INVALID_REQUEST: 400,
  VALIDATION_ERROR: 400,
  AUTH_FAILED: 401,
  USER_NOT_REGISTERED: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const satisfies Record<ErrorCode, number>

// HTTPステータスコードの型
export type HttpStatusCode = (typeof ErrorCodeToHttpStatus)[ErrorCode]

// ヘルパー関数: エラーコードから対応するHTTPステータスコードを取得
export function getHttpStatusFromErrorCode(errorCode: ErrorCode): number {
  return ErrorCodeToHttpStatus[errorCode]
}

export type ApiResponseUserProfile = {
  userId: string
  name: string
}
