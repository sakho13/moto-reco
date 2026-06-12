import { describe, expect, test } from 'vitest'
import {
  createMyUserBikeId,
  createTouringId,
  createTouringPlanId,
  Touring,
} from '@repo/shared-types'
import { TouringEntity } from '@/lib/api/server/entities/TouringEntity'

const baseProps = (overrides: Partial<Touring> = {}): Touring => ({
  touringId: createTouringId('touring-1'),
  myUserBikeId: createMyUserBikeId('bike-1'),
  touringPlanId: null,
  title: '日帰り箱根ツーリング',
  startDate: new Date('2026-07-01T08:00:00.000Z'),
  endDate: new Date('2026-07-01T18:00:00.000Z'),
  startMileage: 1000,
  endMileage: 1200,
  startLatitude: 35.6812,
  startLongitude: 139.7671,
  endLatitude: 35.2323,
  endLongitude: 139.1069,
  status: 'COMPLETED',
  ...overrides,
})

describe('TouringEntity', () => {
  test('正常な値で生成できる', () => {
    const entity = new TouringEntity(baseProps())

    expect(entity.id).toBe('touring-1')
    expect(entity.myUserBikeId).toBe('bike-1')
    expect(entity.touringPlanId).toBeNull()
    expect(entity.title).toBe('日帰り箱根ツーリング')
    expect(entity.status).toBe('COMPLETED')
  })

  test('toJsonで内部値をそのまま取得できる', () => {
    const props = baseProps()
    const entity = new TouringEntity(props)

    expect(entity.toJson()).toEqual(props)
  })

  test('touringPlanIdが設定されている場合に取得できる', () => {
    const entity = new TouringEntity(
      baseProps({ touringPlanId: createTouringPlanId('plan-1') })
    )

    expect(entity.touringPlanId).toBe('plan-1')
  })

  test('statusはSTARTEDで生成できる', () => {
    const entity = new TouringEntity(
      baseProps({
        status: 'STARTED',
        endDate: new Date('2026-07-01T08:00:00.000Z'),
        endMileage: null,
        endLatitude: null,
        endLongitude: null,
      })
    )

    expect(entity.status).toBe('STARTED')
  })

  test('タイトルが空文字の場合はエラーになる', () => {
    expect(() => new TouringEntity(baseProps({ title: '' }))).toThrow(
      'タイトルは1文字以上である必要があります'
    )
  })

  test('開始日が終了日より後の場合はエラーになる', () => {
    expect(
      () =>
        new TouringEntity(
          baseProps({
            startDate: new Date('2026-07-01T18:00:00.000Z'),
            endDate: new Date('2026-07-01T08:00:00.000Z'),
          })
        )
    ).toThrow('開始日は終了日以前である必要があります')
  })

  test('開始時の総走行距離が負の場合はエラーになる', () => {
    expect(
      () => new TouringEntity(baseProps({ startMileage: -1 }))
    ).toThrow('開始時の総走行距離は0以上である必要があります')
  })

  test('終了時の総走行距離が負の場合はエラーになる', () => {
    expect(() => new TouringEntity(baseProps({ endMileage: -1 }))).toThrow(
      '終了時の総走行距離は0以上である必要があります'
    )
  })

  test('開始時の総走行距離が終了時の総走行距離より大きい場合はエラーになる', () => {
    expect(
      () =>
        new TouringEntity(
          baseProps({ startMileage: 1500, endMileage: 1000 })
        )
    ).toThrow(
      '開始時の総走行距離は終了時の総走行距離以下である必要があります'
    )
  })

  test('開始地点の緯度が範囲外の場合はエラーになる', () => {
    expect(
      () => new TouringEntity(baseProps({ startLatitude: 90.1 }))
    ).toThrow('開始地点の緯度は-90以上90以下である必要があります')
  })

  test('開始地点の経度が範囲外の場合はエラーになる', () => {
    expect(
      () => new TouringEntity(baseProps({ startLongitude: 180.1 }))
    ).toThrow('開始地点の経度は-180以上180以下である必要があります')
  })

  test('終了地点の緯度が範囲外の場合はエラーになる', () => {
    expect(
      () => new TouringEntity(baseProps({ endLatitude: -90.1 }))
    ).toThrow('終了地点の緯度は-90以上90以下である必要があります')
  })

  test('終了地点の経度が範囲外の場合はエラーになる', () => {
    expect(
      () => new TouringEntity(baseProps({ endLongitude: -180.1 }))
    ).toThrow('終了地点の経度は-180以上180以下である必要があります')
  })

  test('走行距離・位置情報がnullの場合はエラーにならない', () => {
    expect(
      () =>
        new TouringEntity(
          baseProps({
            startMileage: null,
            endMileage: null,
            startLatitude: null,
            startLongitude: null,
            endLatitude: null,
            endLongitude: null,
          })
        )
    ).not.toThrow()
  })
})
