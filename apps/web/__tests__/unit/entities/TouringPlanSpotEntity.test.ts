import { describe, expect, test } from 'vitest'
import { TouringPlanSpotEntity } from '@repo/shared-domain'
import {
  createTouringPlanId,
  createTouringPlanSpotId,
  TouringPlanSpot,
} from '@repo/shared-types'

const baseProps = (
  overrides: Partial<TouringPlanSpot> = {}
): TouringPlanSpot => ({
  touringPlanSpotId: createTouringPlanSpotId('plan-spot-1'),
  touringPlanId: createTouringPlanId('plan-1'),
  type: 'SPOT',
  name: '休憩スポット',
  memo: 'コンビニで小休止',
  latitude: 35.6812,
  longitude: 139.7671,
  stayMinutes: null,
  travelMinutesFromPrev: null,
  routeTypeFromPrev: null,
  sortOrder: 0,
  ...overrides,
})

describe('TouringPlanSpotEntity', () => {
  test('正常な値で生成できる', () => {
    const entity = new TouringPlanSpotEntity(baseProps())

    expect(entity.id).toBe('plan-spot-1')
    expect(entity.touringPlanId).toBe('plan-1')
    expect(entity.type).toBe('SPOT')
    expect(entity.name).toBe('休憩スポット')
    expect(entity.memo).toBe('コンビニで小休止')
    expect(entity.latitude).toBe(35.6812)
    expect(entity.longitude).toBe(139.7671)
    expect(entity.sortOrder).toBe(0)
  })

  test('toJsonで内部値をそのまま取得できる', () => {
    const props = baseProps()
    const entity = new TouringPlanSpotEntity(props)

    expect(entity.toJson()).toEqual(props)
  })

  test('緯度・経度がnullの場合はエラーにならない', () => {
    expect(
      () =>
        new TouringPlanSpotEntity(
          baseProps({ latitude: null, longitude: null })
        )
    ).not.toThrow()
  })

  test('緯度が-90未満の場合はエラーになる', () => {
    expect(
      () => new TouringPlanSpotEntity(baseProps({ latitude: -90.1 }))
    ).toThrow('緯度は-90以上90以下である必要があります')
  })

  test('緯度が90を超える場合はエラーになる', () => {
    expect(
      () => new TouringPlanSpotEntity(baseProps({ latitude: 90.1 }))
    ).toThrow('緯度は-90以上90以下である必要があります')
  })

  test('経度が-180未満の場合はエラーになる', () => {
    expect(
      () => new TouringPlanSpotEntity(baseProps({ longitude: -180.1 }))
    ).toThrow('経度は-180以上180以下である必要があります')
  })

  test('経度が180を超える場合はエラーになる', () => {
    expect(
      () => new TouringPlanSpotEntity(baseProps({ longitude: 180.1 }))
    ).toThrow('経度は-180以上180以下である必要があります')
  })

  test('START種別で生成できる', () => {
    const entity = new TouringPlanSpotEntity(
      baseProps({
        type: 'START',
        sortOrder: 0,
      })
    )

    expect(entity.type).toBe('START')
  })

  test('DESTINATION種別で生成できる', () => {
    const entity = new TouringPlanSpotEntity(
      baseProps({
        type: 'DESTINATION',
        sortOrder: 9999,
      })
    )

    expect(entity.type).toBe('DESTINATION')
  })
})
