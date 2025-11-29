import { ErrorCode, ErrorResponse } from '@packages/shared-types'

export class ApiV1Error extends Error {
  private _errorCode: ErrorCode
  private _message: string
  private _details?: unknown

  constructor(errorCode: ErrorCode, message: string, details?: unknown) {
    super(message)
    this._errorCode = errorCode
    this._message = message
    this._details = details
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
    return 500
  }
}
