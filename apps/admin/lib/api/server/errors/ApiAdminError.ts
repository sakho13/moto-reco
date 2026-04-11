import {
  ErrorCode,
  ErrorResponse,
  getHttpStatusFromErrorCode,
} from '@repo/shared-types'

export class ApiAdminError extends Error {
  private _errorCode: ErrorCode
  private _message: string
  private _details?: unknown

  constructor(errorCode: ErrorCode, message: string, details?: unknown) {
    super(message)
    this._errorCode = errorCode
    this._message = message
    this._details = details

    this.name = 'ApiAdminError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiAdminError)
    }
  }

  public toErrorResponse(): ErrorResponse {
    return {
      status: 'error',
      errorCode: this._errorCode,
      message: this._message,
      details: this._details,
    }
  }

  public get statusCode(): number {
    return getHttpStatusFromErrorCode(this._errorCode)
  }

  public get errorCode(): ErrorCode {
    return this._errorCode
  }
}
