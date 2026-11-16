import { NextRequest } from 'next/server'
import { describe, expect, test } from 'vitest'
import { parsePaginationParams } from '@/lib/api/auth'

const buildRequest = (query: string) =>
  new NextRequest(`http://localhost/api/admin/users?${query}`)

describe('parsePaginationParams', () => {
  test('未指定の場合は先頭から10件・作成日時の降順になる', () => {
    expect(parsePaginationParams(buildRequest(''))).toEqual({
      skip: 0,
      take: 10,
      sort: 'createdAt',
      order: 'desc',
      q: '',
    })
  })

  test('正しい値はそのまま使われる', () => {
    const result = parsePaginationParams(
      buildRequest('_start=20&_end=45&_sort=name&_order=ASC&q=abc')
    )
    expect(result).toEqual({
      skip: 20,
      take: 25,
      sort: 'name',
      order: 'asc',
      q: 'abc',
    })
  })

  test.each(['_start=-1', '_start=abc', '_start=1.5', '_start=Infinity'])(
    '不正な _start（%s）は 0 として扱われる',
    (query) => {
      const result = parsePaginationParams(buildRequest(`${query}&_end=10`))
      expect(result.skip).toBe(0)
      expect(result.take).toBe(10)
    }
  )

  test('_end が _start 以下の場合でも take は 1 以上になる', () => {
    const result = parsePaginationParams(buildRequest('_start=10&_end=5'))
    expect(result.take).toBe(1)
  })

  test('取得件数は 500 件に制限される', () => {
    const result = parsePaginationParams(buildRequest('_start=0&_end=100000'))
    expect(result.take).toBe(500)
  })

  test('不正な _order は desc として扱われる', () => {
    const result = parsePaginationParams(buildRequest('_order=drop'))
    expect(result.order).toBe('desc')
  })
})
