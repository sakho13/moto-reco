import {
  ErrorCode,
  ErrorResponse,
  getHttpStatusFromErrorCode,
} from '@packages/shared-types'

export class ApiV1Error extends Error {
  private _errorCode: ErrorCode
  private _message: string
  private _details?: unknown

  constructor(errorCode: ErrorCode, message: string, details?: unknown) {
    super(message)
    this._errorCode = errorCode
    this._message = message
    this._details = details

    // Errorクラスの標準プロパティを設定
    this.name = 'ApiV1Error'

    // スタックトレースを保持
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiV1Error)
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

  // エラーコードに基づいて適切なHTTPステータスコードを返す
  public get statusCode(): number {
    return getHttpStatusFromErrorCode(this._errorCode)
  }

  // エラーコードのゲッター（デバッグ用）
  public get errorCode(): ErrorCode {
    return this._errorCode
  }
}
