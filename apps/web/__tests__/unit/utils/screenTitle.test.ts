import { describe, expect, it } from 'vitest'
import { createScreenTitle } from '@/lib/screenTitle'

describe('createScreenTitle', () => {
  it('画面名を default に持つ', () => {
    expect(createScreenTitle('給油履歴')).toEqual(
      expect.objectContaining({ default: '給油履歴' })
    )
  })

  it('配下の画面向けに「%s | MotoReco」の template を持つ', () => {
    expect(createScreenTitle('愛車の詳細')).toEqual(
      expect.objectContaining({ template: '%s | MotoReco' })
    )
  })
})
