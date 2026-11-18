import { ApiV1Error } from '@repo/shared-domain'
import { ERROR_MESSAGES, getFirebaseErrorMessage } from '@repo/shared-utils'

/** Firebase のエラー（`code` が `auth/` で始まる）かどうか */
function isFirebaseAuthError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('auth/')
  )
}

/** 通信できなかったときに fetch が投げるエラーかどうか */
function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    /network request failed|failed to fetch/i.test(error.message)
  )
}

/**
 * 画面に出すエラーメッセージを決める
 *
 * @remarks
 * API のエラーはサーバーが返したメッセージ、Firebase のエラーは Web と同じ
 * 日本語のメッセージにする。どれにも当てはまらなければ `fallback` を返す。
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiV1Error) {
    return error.message
  }
  if (isFirebaseAuthError(error)) {
    if (error.code === 'auth/network-request-failed') {
      return ERROR_MESSAGES.API.NETWORK_ERROR
    }
    return getFirebaseErrorMessage(error.code)
  }
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.API.NETWORK_ERROR
  }
  return fallback
}
