import { describe, expect, it } from 'vitest'
import { themes } from '@repo/theme'
import { createAppTheme, toDp, toFontWeight } from './tokens'

describe('toDp', () => {
  it('rem を 1rem = 16 で数値にする', () => {
    expect(toDp('1rem')).toBe(16)
    expect(toDp('0.875rem')).toBe(14)
  })

  it('px と単位なしの値はそのまま数値にする', () => {
    expect(toDp('9999px')).toBe(9999)
    expect(toDp('0')).toBe(0)
  })

  it('数値にできない値は 0 にする', () => {
    expect(toDp('auto')).toBe(0)
  })
})

describe('createAppTheme', () => {
  it('色は @repo/theme の値をそのまま使い、長さは数値にする', () => {
    const theme = createAppTheme('dark')
    expect(theme.colors).toEqual(themes.default.dark.colors)
    expect(theme.spacing[4]).toBe(16)
    expect(theme.fontSizes.sm).toBe(14)
    expect(theme.radius.lg).toBe(14)
  })
})

describe('toFontWeight', () => {
  it('100 刻みの値はそのまま返す', () => {
    expect(toFontWeight(700)).toBe(700)
  })

  it('100 刻み以外の値はいちばん近い太さに丸める', () => {
    expect(toFontWeight(450)).toBe(400)
    expect(toFontWeight(560)).toBe(600)
  })
})
