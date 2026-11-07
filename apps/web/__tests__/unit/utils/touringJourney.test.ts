import { describe, expect, test } from 'vitest'
import type {
  ApiResponseSpotDetail,
  ApiResponseTouringDetail,
} from '@repo/shared-types'
import {
  buildJourney,
  formatDuration,
  formatStayTime,
  formatTouringDate,
  getListRoutePoints,
  getStoneShape,
  getStoneWidth,
  groupTouringsByMonth,
  layoutJourney,
  projectRoute,
} from '@/lib/utils/touringJourney'

const buildTouring = (
  overrides: Partial<ApiResponseTouringDetail> = {}
): ApiResponseTouringDetail => ({
  touringId: 'touring-1',
  touringPlanId: null,
  title: '伊豆',
  startDate: '2026-10-18T06:40:00+09:00',
  endDate: '2026-10-18T18:20:00+09:00',
  startMileage: 1000,
  endMileage: 1323,
  startLatitude: 35.3,
  startLongitude: 139.5,
  endLatitude: 35.3,
  endLongitude: 139.5,
  status: 'COMPLETED',
  fuelLogIds: [],
  ...overrides,
})

const buildSpot = (
  overrides: Partial<ApiResponseSpotDetail> & { spotId: string }
): ApiResponseSpotDetail => ({
  touringId: 'touring-1',
  type: 'SPOT',
  name: 'スポット',
  memo: null,
  latitude: 35,
  longitude: 139,
  plannedArrivalAt: null,
  plannedDepartureAt: null,
  arrivedAt: '2026-10-18T08:30:00+09:00',
  departedAt: '2026-10-18T09:05:00+09:00',
  isSkipped: false,
  skippedAt: null,
  sortOrder: 0,
  ...overrides,
})

describe('buildJourney', () => {
  test('スポットに番号を振り、スキップと休憩は番号に数えない', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({ spotId: 'a' }),
      buildSpot({ spotId: 'b', type: 'BREAK' }),
      buildSpot({ spotId: 'c', isSkipped: true, arrivedAt: null }),
      buildSpot({ spotId: 'd' }),
    ])

    expect(journey.nodes.map((node) => node.mark)).toEqual([
      '出',
      '1',
      '休',
      '不',
      '2',
      '着',
    ])
    expect(journey.spotCount).toBe(2)
    expect(journey.breakCount).toBe(1)
  })

  test('スキップ地点は経路と区間に含めない', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({ spotId: 'a', latitude: 34, longitude: 138 }),
      buildSpot({
        spotId: 'skip',
        isSkipped: true,
        arrivedAt: null,
        latitude: 33,
        longitude: 137,
      }),
      buildSpot({ spotId: 'b', latitude: 32, longitude: 136 }),
    ])

    expect(journey.routePoints).not.toContainEqual({ lat: 33, lng: 137 })
    expect(journey.routeUrl).not.toContain('33,137')
    expect(journey.legs.map((leg) => [leg.fromId, leg.toId])).toEqual([
      ['start', 'a'],
      ['a', 'b'],
      ['b', 'destination'],
    ])
  })

  test('座標が欠けた区間は経路リンクを持たない', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({ spotId: 'a', latitude: null, longitude: null }),
    ])

    expect(journey.legs[0]?.href).toBeNull()
    expect(journey.legs[1]?.href).toBeNull()
  })

  test('名前のない地点は種別ごとの代替名になる', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({ spotId: 'a', name: null }),
      buildSpot({ spotId: 'b', name: null, type: 'BREAK' }),
    ])

    expect(journey.nodes[1]?.name).toBe('名もなきスポット')
    expect(journey.nodes[2]?.name).toBe('休憩')
  })

  test('いちばん長居と最長の区間に印を付ける', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({
        spotId: 'short',
        arrivedAt: '2026-10-18T08:00:00+09:00',
        departedAt: '2026-10-18T08:10:00+09:00',
      }),
      buildSpot({
        spotId: 'long',
        arrivedAt: '2026-10-18T12:00:00+09:00',
        departedAt: '2026-10-18T13:00:00+09:00',
      }),
    ])

    const longestStay = journey.nodes.filter((node) => node.isLongestStay)
    expect(longestStay.map((node) => node.id)).toEqual(['long'])
    const longestLeg = journey.legs.filter((leg) => leg.isLongest)
    expect(longestLeg.map((leg) => leg.toId)).toEqual(['destination'])
  })

  test('同点のときは印を付けない', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({ spotId: 'a' }),
      buildSpot({ spotId: 'b' }),
    ])

    expect(journey.nodes.some((node) => node.isLongestStay)).toBe(false)
  })

  test('比べる相手がないときは印を付けない', () => {
    const journey = buildJourney(
      buildTouring({ endLatitude: null, endLongitude: null }),
      [buildSpot({ spotId: 'only' })]
    )

    expect(journey.nodes.some((node) => node.isLongestStay)).toBe(false)
  })

  test('進行中は未到達の地点を保留にし、最後に発った地点の先を現在地にする', () => {
    const journey = buildJourney(
      buildTouring({
        status: 'STARTED',
        endDate: '2026-10-18T06:40:00+09:00',
        endMileage: null,
      }),
      [
        buildSpot({ spotId: 'visited' }),
        buildSpot({ spotId: 'next', arrivedAt: null, departedAt: null }),
      ]
    )

    expect(journey.hereAfterId).toBe('visited')
    expect(
      journey.nodes.filter((node) => node.isPending).map((node) => node.id)
    ).toEqual(['next', 'destination'])
    expect(journey.spotCount).toBe(1)
    expect(journey.distance).toBeNull()
  })

  test('進行中に最後の地点で滞在中なら、その地点を現在地にする', () => {
    const journey = buildJourney(
      buildTouring({
        status: 'STARTED',
        endLatitude: null,
        endLongitude: null,
      }),
      [buildSpot({ spotId: 'break', type: 'BREAK', departedAt: null })]
    )

    expect(journey.hereAfterId).toBeNull()
    expect(journey.nodes.find((node) => node.id === 'break')?.isCurrent).toBe(
      true
    )
  })

  test('進行中は未到達の後ろに保存された休憩を着いた地点として先に並べる', () => {
    const journey = buildJourney(
      buildTouring({
        status: 'STARTED',
        endLatitude: null,
        endLongitude: null,
      }),
      [
        buildSpot({ spotId: 'visited' }),
        buildSpot({ spotId: 'next', arrivedAt: null, departedAt: null }),
        buildSpot({ spotId: 'break', type: 'BREAK', departedAt: null }),
      ]
    )

    expect(journey.nodes.map((node) => node.id)).toEqual([
      'start',
      'visited',
      'break',
      'next',
    ])
    expect(journey.nodes.find((node) => node.id === 'break')?.isCurrent).toBe(
      true
    )
  })

  test('進行中で終着地の座標がなければ終着地を出さない', () => {
    const journey = buildJourney(
      buildTouring({
        status: 'STARTED',
        endLatitude: null,
        endLongitude: null,
      }),
      []
    )

    expect(journey.nodes.map((node) => node.kind)).toEqual(['start'])
    expect(journey.hereAfterId).toBe('start')
  })

  test('完了済みで期間の外にある時刻は移動時間と日数に使わない', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({
        spotId: 'late',
        arrivedAt: '2026-11-01T17:00:00+09:00',
        departedAt: '2026-11-01T17:30:00+09:00',
      }),
    ])

    expect(journey.legs.map((leg) => leg.minutes)).toEqual([null, null])
    expect(journey.legs.map((leg) => leg.dayNumber)).toEqual([null, null])
  })

  test('日付が変わる区間に日数を持たせる', () => {
    const journey = buildJourney(
      buildTouring({ endDate: '2026-10-19T18:00:00+09:00' }),
      [
        buildSpot({ spotId: 'day1' }),
        buildSpot({
          spotId: 'day2',
          arrivedAt: '2026-10-19T09:00:00+09:00',
          departedAt: '2026-10-19T10:00:00+09:00',
        }),
      ]
    )

    expect(journey.legs.map((leg) => leg.dayNumber)).toEqual([null, 2, null])
  })
})

describe('layoutJourney', () => {
  test('石を左右交互に置き、スキップは道を曲げない', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({ spotId: 'a' }),
      buildSpot({ spotId: 'skip', isSkipped: true, arrivedAt: null }),
      buildSpot({ spotId: 'b' }),
    ])

    const summary = layoutJourney(journey).map((row) => {
      if (row.type === 'stop') return `stop:${row.node.id}:${row.side}`
      if (row.type === 'skip') return `skip:${row.node.id}:${row.roadSide}`
      if (row.type === 'leg') return `leg:${row.fromSide}>${row.toSide}`
      return 'tail'
    })

    expect(summary).toEqual([
      'stop:start:left',
      'leg:left>right',
      'stop:a:right',
      'skip:skip:right',
      'leg:right>left',
      'stop:b:left',
      'leg:left>right',
      'stop:destination:right',
    ])
  })

  test('進行中で次の地点がなければ道の終わりに現在地を置く', () => {
    const journey = buildJourney(
      buildTouring({
        status: 'STARTED',
        endLatitude: null,
        endLongitude: null,
      }),
      [buildSpot({ spotId: 'a' })]
    )

    expect(layoutJourney(journey).at(-1)).toEqual({
      type: 'tail',
      fromSide: 'right',
      showsHere: true,
    })
  })

  test('次の地点があれば現在地は区間の途中に置く', () => {
    const journey = buildJourney(
      buildTouring({ status: 'STARTED', endDate: '2026-10-18T06:40:00+09:00' }),
      []
    )

    const leg = layoutJourney(journey).find((row) => row.type === 'leg')
    expect(leg).toMatchObject({ showsHere: true })
  })
})

describe('getStoneWidth', () => {
  const widthOf = (stayMinutes: number | null) => {
    const journey = buildJourney(buildTouring(), [buildSpot({ spotId: 'a' })])
    return getStoneWidth({ ...journey.nodes[1]!, stayMinutes })
  }

  test('滞在が長いほど大きく、上限で止まる', () => {
    expect(widthOf(20)).toBeLessThan(widthOf(50))
    expect(widthOf(600)).toBe(88)
  })

  test('滞在時間が不明なら標準の大きさになる', () => {
    expect(widthOf(null)).toBe(68)
  })
})

describe('getStoneShape', () => {
  test('同じIDは同じ形になる', () => {
    expect(getStoneShape('spot-1')).toBe(getStoneShape('spot-1'))
  })
})

describe('projectRoute', () => {
  test('2点未満なら描かない', () => {
    expect(projectRoute([{ lat: 35, lng: 139 }], 100, 100, 8)).toEqual([])
  })

  test('すべて同じ地点なら描かない', () => {
    const point = { lat: 35, lng: 139 }
    expect(projectRoute([point, point], 100, 100, 8)).toEqual([])
  })

  test('余白の内側に収め、北を上にする', () => {
    const projected = projectRoute(
      [
        { lat: 36, lng: 139 },
        { lat: 35, lng: 139.5 },
      ],
      100,
      100,
      8
    )

    for (const point of projected) {
      expect(point.x).toBeGreaterThanOrEqual(8)
      expect(point.x).toBeLessThanOrEqual(92)
      expect(point.y).toBeGreaterThanOrEqual(8)
      expect(point.y).toBeLessThanOrEqual(92)
    }
    expect(projected[0]!.y).toBeLessThan(projected[1]!.y)
  })
})

describe('getListRoutePoints', () => {
  test('スキップした地点と未設定の座標を除く', () => {
    const points = getListRoutePoints({
      status: 'COMPLETED',
      startLatitude: 35,
      startLongitude: 139,
      endLatitude: 34,
      endLongitude: 138,
      stops: [
        {
          type: 'SPOT',
          isSkipped: true,
          hasArrived: false,
          latitude: 33,
          longitude: 137,
        },
        {
          type: 'SPOT',
          isSkipped: false,
          hasArrived: true,
          latitude: null,
          longitude: null,
        },
        {
          type: 'BREAK',
          isSkipped: false,
          hasArrived: true,
          latitude: 32,
          longitude: 136,
        },
      ],
    })

    expect(points).toEqual([
      { lat: 35, lng: 139 },
      { lat: 32, lng: 136 },
      { lat: 34, lng: 138 },
    ])
  })
})

describe('groupTouringsByMonth', () => {
  const touring = (
    startDate: string,
    status: 'STARTED' | 'COMPLETED',
    distance: number | null
  ) => ({
    startDate,
    status,
    startMileage: distance === null ? null : 0,
    endMileage: distance,
  })

  test('連続する同じ月をまとめ、距離を合計する', () => {
    const groups = groupTouringsByMonth([
      touring('2026-10-25T10:00:00+09:00', 'COMPLETED', 100),
      touring('2026-10-03T10:00:00+09:00', 'COMPLETED', null),
      touring('2026-09-20T10:00:00+09:00', 'COMPLETED', 50),
    ])

    expect(
      groups.map((group) => [
        group.label,
        group.items.length,
        group.totalDistance,
      ])
    ).toEqual([
      ['2026年10月', 2, 100],
      ['2026年9月', 1, 50],
    ])
  })

  test('進行中は先頭の走行中にまとめる', () => {
    const groups = groupTouringsByMonth([
      touring('2026-10-25T10:00:00+09:00', 'COMPLETED', 100),
      touring('2026-09-01T10:00:00+09:00', 'STARTED', null),
    ])

    expect(groups.map((group) => group.label)).toEqual(['走行中', '2026年10月'])
  })
})

describe('表示の整形', () => {
  test('所要時間を時間と分に分ける', () => {
    expect(formatDuration(45)).toBe('45分')
    expect(formatDuration(120)).toBe('2時間')
    expect(formatDuration(110)).toBe('1時間50分')
  })

  test('同じ日のツーリングは1日分の日付だけを返す', () => {
    expect(formatTouringDate(buildTouring())).toBe('2026年10月18日（日）')
  })

  test('日をまたぐツーリングは範囲で返す', () => {
    expect(
      formatTouringDate(buildTouring({ endDate: '2026-10-20T18:00:00+09:00' }))
    ).toBe('2026年10月18日（日） 〜 10月20日（火）')
  })

  test('進行中は終了日を出さない', () => {
    expect(
      formatTouringDate(
        buildTouring({
          status: 'STARTED',
          endDate: '2026-10-20T18:00:00+09:00',
        })
      )
    ).toBe('2026年10月18日（日）')
  })

  test('到着だけの地点は着の表記になる', () => {
    const journey = buildJourney(buildTouring(), [
      buildSpot({ spotId: 'a', departedAt: null }),
    ])

    expect(formatStayTime(journey.nodes[1]!)).toBe('08:30 着')
  })
})
