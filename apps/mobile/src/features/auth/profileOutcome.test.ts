import { describe, expect, it } from 'vitest'
import { ApiV1Error } from '@repo/shared-domain'
import { classifyProfileError } from './profileOutcome'

describe('classifyProfileError', () => {
  it('ユーザー登録が済んでいなければ needsRegistration', () => {
    const error = new ApiV1Error('USER_NOT_REGISTERED', '未登録')
    expect(classifyProfileError(error)).toBe('needsRegistration')
  })

  it('退会済みなら quit', () => {
    const error = new ApiV1Error('USER_QUIT', '退会済み')
    expect(classifyProfileError(error)).toBe('quit')
  })

  it('IDトークンが無効なら invalidSession', () => {
    const error = new ApiV1Error('AUTH_FAILED', '無効')
    expect(classifyProfileError(error)).toBe('invalidSession')
  })

  it('サーバーエラーや通信エラーは unavailable（ログイン状態を保つ）', () => {
    expect(classifyProfileError(new ApiV1Error('SERVER_ERROR', 'エラー'))).toBe(
      'unavailable'
    )
    expect(classifyProfileError(new TypeError('Network request failed'))).toBe(
      'unavailable'
    )
  })
})
