import { describe, expect, it } from 'vitest'
import {
  getFirebaseErrorMessage,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from '@repo/shared-utils'

describe('validateEmail', () => {
  it('未入力・空白のみはエラー', () => {
    expect(validateEmail('')).toBe('メールアドレスを入力してください')
    expect(validateEmail('  ')).toBe('メールアドレスを入力してください')
  })

  it('形式が不正ならエラー', () => {
    expect(validateEmail('rider@example')).toBe(
      '有効なメールアドレスを入力してください'
    )
  })

  it('正しい形式なら null', () => {
    expect(validateEmail('rider@example.com')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('8文字未満はエラー', () => {
    expect(validatePassword('abc123')).toBe(
      'パスワードは8文字以上である必要があります'
    )
  })

  it('英字か数字のどちらかが無ければエラー', () => {
    expect(validatePassword('abcdefgh')).toBe(
      'パスワードは英字と数字を含む必要があります'
    )
    expect(validatePassword('12345678')).toBe(
      'パスワードは英字と数字を含む必要があります'
    )
  })

  it('8文字以上で英字と数字を含めば null', () => {
    expect(validatePassword('abcd1234')).toBeNull()
  })
})

describe('validatePasswordMatch', () => {
  it('確認用が未入力・不一致ならエラー', () => {
    expect(validatePasswordMatch('abcd1234', '')).toBe(
      'パスワード（確認）を入力してください'
    )
    expect(validatePasswordMatch('abcd1234', 'abcd12345')).toBe(
      'パスワードが一致しません'
    )
  })

  it('一致すれば null', () => {
    expect(validatePasswordMatch('abcd1234', 'abcd1234')).toBeNull()
  })
})

describe('validateName', () => {
  it('未入力・50文字超はエラー', () => {
    expect(validateName(' ')).toBe('ユーザー名を入力してください')
    expect(validateName('あ'.repeat(51))).toBe(
      'ユーザー名は50文字以内である必要があります'
    )
  })

  it('前後の空白を除いて50文字以内なら null', () => {
    expect(validateName(` ${'あ'.repeat(50)} `)).toBeNull()
  })
})

describe('getFirebaseErrorMessage', () => {
  it('既知のエラーコードは日本語のメッセージに変換する', () => {
    expect(getFirebaseErrorMessage('auth/email-already-in-use')).toBe(
      'このメールアドレスは既に使用されています'
    )
  })

  it('未知のエラーコードは汎用メッセージにする', () => {
    expect(getFirebaseErrorMessage('auth/unknown')).toBe(
      '予期しないエラーが発生しました'
    )
  })
})
