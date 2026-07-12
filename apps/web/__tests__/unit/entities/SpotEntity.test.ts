import { describe, expect, test } from 'vitest'
import { createSpotId, createTouringId, Spot } from '@repo/shared-types'
import { SpotEntity } from '@/lib/api/server/entities/SpotEntity'

const baseProps = (overrides: Partial<Spot> = {}): Spot => ({
  spotId: createSpotId('spot-1'),
  touringId: createTouringId('touring-1'),
  type: 'SPOT',
  name: '休憩スポット',
  memo: 'コンビニで小休止',
  latitude: 35.6812,
  longitude: 139.7671,
  plannedArrivalAt: new Date('2026-07-01T10:00:00.000Z'),
  plannedDepartureAt: new Date('2026-07-01T10:30:00.000Z'),
  arrivedAt: new Date('2026-07-01T10:05:00.000Z'),
  departedAt: new Date('2026-07-01T10:35:00.000Z'),
  isSkipped: false,
  skippedAt: null,
  sortOrder: 0,
  ...overrides,
})

describe('SpotEntity', () => {
  test('正常な値で生成できる', () => {
    const entity = new SpotEntity(baseProps())

    expect(entity.id).toBe('spot-1')
    expect(entity.touringId).toBe('touring-1')
    expect(entity.type).toBe('SPOT')
    expect(entity.name).toBe('休憩スポット')
    expect(entity.memo).toBe('コンビニで小休止')
    expect(entity.latitude).toBe(35.6812)
    expect(entity.longitude).toBe(139.7671)
    expect(entity.plannedArrivalAt).toEqual(
      new Date('2026-07-01T10:00:00.000Z')
    )
    expect(entity.plannedDepartureAt).toEqual(
      new Date('2026-07-01T10:30:00.000Z')
    )
    expect(entity.arrivedAt).toEqual(new Date('2026-07-01T10:05:00.000Z'))
    expect(entity.departedAt).toEqual(new Date('2026-07-01T10:35:00.000Z'))
    expect(entity.isSkipped).toBe(false)
    expect(entity.skippedAt).toBeNull()
    expect(entity.sortOrder).toBe(0)
  })

  test('toJsonで内部値をそのまま取得できる', () => {
    const props = baseProps()
    const entity = new SpotEntity(props)

    expect(entity.toJson()).toEqual(props)
  })

  test('緯度が範囲外の場合はエラーになる', () => {
    expect(() => new SpotEntity(baseProps({ latitude: 90.1 }))).toThrow(
      '緯度は-90以上90以下である必要があります'
    )
  })

  test('経度が範囲外の場合はエラーになる', () => {
    expect(() => new SpotEntity(baseProps({ longitude: -180.1 }))).toThrow(
      '経度は-180以上180以下である必要があります'
    )
  })

  test('到着日時が出発日時より後の場合はエラーになる', () => {
    expect(
      () =>
        new SpotEntity(
          baseProps({
            arrivedAt: new Date('2026-07-01T10:35:00.000Z'),
            departedAt: new Date('2026-07-01T10:05:00.000Z'),
          })
        )
    ).toThrow('到着日時は出発日時以前である必要があります')
  })

  test('到着予定日時が出発予定日時より後の場合はエラーになる', () => {
    expect(
      () =>
        new SpotEntity(
          baseProps({
            plannedArrivalAt: new Date('2026-07-01T10:30:00.000Z'),
            plannedDepartureAt: new Date('2026-07-01T10:00:00.000Z'),
          })
        )
    ).toThrow('到着予定日時は出発予定日時以前である必要があります')
  })

  test('isSkippedがtrueでskippedAtが設定されている場合は生成できる', () => {
    const entity = new SpotEntity(
      baseProps({
        isSkipped: true,
        skippedAt: new Date('2026-07-01T10:10:00.000Z'),
      })
    )

    expect(entity.isSkipped).toBe(true)
    expect(entity.skippedAt).toEqual(new Date('2026-07-01T10:10:00.000Z'))
  })

  test('BREAK種別で生成できる', () => {
    const entity = new SpotEntity(baseProps({ type: 'BREAK' }))

    expect(entity.type).toBe('BREAK')
  })

  test('全てのフィールドがnullの場合でもエラーにならない', () => {
    expect(
      () =>
        new SpotEntity(
          baseProps({
            name: null,
            memo: null,
            latitude: null,
            longitude: null,
            plannedArrivalAt: null,
            plannedDepartureAt: null,
            arrivedAt: null,
            departedAt: null,
            skippedAt: null,
          })
        )
    ).not.toThrow()
  })
})
