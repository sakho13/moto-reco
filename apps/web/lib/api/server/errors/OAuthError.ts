export type OAuthErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope'
  | 'invalid_client_metadata'
  | 'access_denied'

export type OAuthErrorBody = {
  error: OAuthErrorCode
  error_description: string
}

/**
 * OAuth 2.0 準拠のエラー
 *
 * @remarks
 * RFC 6749 / RFC 7591 のエラーレスポンス形式（`{error, error_description}`）で
 * クライアントに返却するためのエラークラス。アプリ内共通の `ApiV1Error` とは
 * レスポンス形式が異なるため、OAuth関連エンドポイント専用として使い分ける。
 */
export class OAuthError extends Error {
  private _error: OAuthErrorCode
  private _statusCode: number

  constructor(error: OAuthErrorCode, description: string, statusCode = 400) {
    super(description)
    this.name = 'OAuthError'
    this._error = error
    this._statusCode = statusCode

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OAuthError)
    }
  }

  public get error(): OAuthErrorCode {
    return this._error
  }

  public get statusCode(): number {
    return this._statusCode
  }

  public toErrorResponse(): OAuthErrorBody {
    return { error: this._error, error_description: this.message }
  }
}
