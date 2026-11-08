import { describe, expect, test } from 'vitest'
import { canUsePhotos } from '@/lib/utils/photoAccess'

describe('canUsePhotos', () => {
  test('ADMINは写真を使える', () => {
    expect(canUsePhotos('ADMIN')).toBe(true)
  })

  test('USERとGUESTは写真を使えない', () => {
    expect(canUsePhotos('USER')).toBe(false)
    expect(canUsePhotos('GUEST')).toBe(false)
  })

  test('プロフィールの取得前は写真を使えない', () => {
    expect(canUsePhotos(undefined)).toBe(false)
  })
})
