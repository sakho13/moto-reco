import { describe, expect, it } from 'vitest'
import { selectActiveBike } from './selectActiveBike'

const bikes = [{ myUserBikeId: 'a' }, { myUserBikeId: 'b' }]

describe('selectActiveBike', () => {
  it('前回選んだ愛車が一覧にあればそれを選ぶ', () => {
    expect(selectActiveBike(bikes, 'b')).toEqual({ myUserBikeId: 'b' })
  })

  it('前回選んだ愛車が無ければ先頭を選ぶ', () => {
    expect(selectActiveBike(bikes, 'deleted')).toEqual({ myUserBikeId: 'a' })
    expect(selectActiveBike(bikes, null)).toEqual({ myUserBikeId: 'a' })
  })

  it('愛車が1台も無ければ null', () => {
    expect(selectActiveBike([], 'a')).toBeNull()
  })
})
