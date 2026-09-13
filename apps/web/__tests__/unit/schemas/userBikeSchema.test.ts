import { describe, expect, it } from 'vitest'
import {
  UserBikeRegisterRequestSchema,
  UserBikeUpdateRequestSchema,
} from '@repo/shared-types'

describe('UserBikeRegisterRequestSchema', () => {
  it('purchaseDateにnullを指定してもバリデーションエラーにならず、nullのまま通る', () => {
    const result = UserBikeRegisterRequestSchema.safeParse({
      displacement: 400,
      purchaseDate: null,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.purchaseDate).toBeNull()
    }
  })

  it('purchaseDateを省略した場合はundefinedのまま通る', () => {
    const result = UserBikeRegisterRequestSchema.safeParse({
      displacement: 400,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.purchaseDate).toBeUndefined()
    }
  })

  it('purchaseDateに日付文字列を指定するとDateに変換される（1970/01/01にならない）', () => {
    const result = UserBikeRegisterRequestSchema.safeParse({
      displacement: 400,
      purchaseDate: '2024-01-01T00:00:00.000Z',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.purchaseDate).toEqual(
        new Date('2024-01-01T00:00:00.000Z')
      )
    }
  })
})

describe('UserBikeUpdateRequestSchema', () => {
  it('purchaseDateにnullを指定すると更新項目として認識され、nullのまま通る（購入日クリア）', () => {
    const result = UserBikeUpdateRequestSchema.safeParse({
      purchaseDate: null,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.purchaseDate).toBeNull()
    }
  })

  it('更新項目が何も指定されない場合はエラーになる', () => {
    const result = UserBikeUpdateRequestSchema.safeParse({})

    expect(result.success).toBe(false)
  })
})
