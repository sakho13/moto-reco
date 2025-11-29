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
  AUTH_FAILED: 'AUTH_FAILED',
  USER_NOT_REGISTERED: 'USER_NOT_REGISTERED',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodeMap

export type ApiResUserProfile = {
  id: string
  name: string
}
