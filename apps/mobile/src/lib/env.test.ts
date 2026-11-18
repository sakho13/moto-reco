import { describe, expect, it } from 'vitest'
import { trimTrailingSlash } from './env'

describe('trimTrailingSlash', () => {
  it('末尾のスラッシュを取り除く', () => {
    expect(trimTrailingSlash('http://192.168.0.10:3000/')).toBe(
      'http://192.168.0.10:3000'
    )
    expect(trimTrailingSlash('https://example.com//')).toBe(
      'https://example.com'
    )
  })

  it('末尾にスラッシュが無ければそのまま返す', () => {
    expect(trimTrailingSlash('https://example.com')).toBe('https://example.com')
  })
})
