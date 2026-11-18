import { describe, expect, it } from 'vitest'
import { ApiV1Error } from '@repo/shared-domain'
import { getErrorMessage } from './errorMessage'

describe('getErrorMessage', () => {
  it('API のエラーはサーバーのメッセージを使う', () => {
    const error = new ApiV1Error('VALIDATION_ERROR', '給油量は必須です')
    expect(getErrorMessage(error, '失敗しました')).toBe('給油量は必須です')
  })

  it('Firebase のエラーは日本語のメッセージに変換する', () => {
    const error = { code: 'auth/email-already-in-use' }
    expect(getErrorMessage(error, '失敗しました')).toBe(
      'このメールアドレスは既に使用されています'
    )
  })

  it('通信できなかったときはネットワークエラーのメッセージにする', () => {
    const expected =
      'ネットワークエラーが発生しました。インターネット接続を確認してください'
    expect(
      getErrorMessage(new TypeError('Network request failed'), '失敗しました')
    ).toBe(expected)
    expect(
      getErrorMessage({ code: 'auth/network-request-failed' }, '失敗しました')
    ).toBe(expected)
  })

  it('それ以外は fallback を返す', () => {
    expect(getErrorMessage(new Error('boom'), '失敗しました')).toBe(
      '失敗しました'
    )
  })
})
