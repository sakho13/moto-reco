import { describe, expect, test } from 'vitest'
import type {
  ApiResponseTouringPlanLocation,
  ApiResponseTouringPlanSpotDetail,
} from '@repo/shared-types'
import { layoutJourney } from '@/lib/utils/touringJourney'
import {
  buildPlanJourney,
  formatPlanRoute,
  formatPlanStayTime,
  getPlanListRoutePoints,
  getPlanStoneWidth,
  toPlanPebbleStops,
} from '@/lib/utils/touringPlanJourney'

const buildSpot = (
  overrides: Partial<ApiResponseTouringPlanSpotDetail> & {
    touringPlanSpotId: string
  }
): ApiResponseTouringPlanSpotDetail => ({
  touringPlanId: 'plan-1',
  type: 'SPOT',
  name: 'スポット',
  memo: null,
  latitude: 35,
  longitude: 139,
  plannedArrivalOffsetMinutes: null,
  plannedDepartureOffsetMinutes: null,
  stayMinutes: null,
  travelMinutesFromPrev: null,
  routeTypeFromPrev: null,
  sortOrder: 1,
  ...overrides,
})

const buildLocation = (
  overrides: Partial<ApiResponseTouringPlanLocation> = {}
): ApiResponseTouringPlanLocation => ({
  touringPlanSpotId: 'location',
  latitude: 35.3,
  longitude: 139.5,
  name: null,
  memo: null,
  plannedArrivalOffsetMinutes: null,
  plannedDepartureOffsetMinutes: null,
  stayMinutes: null,
  travelMinutesFromPrev: null,
  routeTypeFromPrev: null,
  ...overrides,
})

const emptyPlan = { startLocation: null, destinationLocation: null }

describe('buildPlanJourney', () => {
  test('スポットに順に番号を振り、休憩は番号を持たない', () => {
    const journey = buildPlanJourney(emptyPlan, [
      buildSpot({ touringPlanSpotId: 'a' }),
      buildSpot({ touringPlanSpotId: 'rest', type: 'BREAK', name: null }),
      buildSpot({ touringPlanSpotId: 'b' }),
    ])

    expect(journey.nodes.map((node) => node.mark)).toEqual([
      '出',
      '1',
      '休',
      '2',
      '着',
    ])
    expect(journey.nodes[2]?.name).toBe('休憩')
    expect(journey.spotCount).toBe(2)
    expect(journey.breakCount).toBe(1)
  })

  test('出発地と目的地が未設定でも行を残し、未設定として扱う', () => {
    const journey = buildPlanJourney(emptyPlan, [])

    expect(journey.nodes.map((node) => [node.id, node.isUnset])).toEqual([
      ['start', true],
      ['destination', true],
    ])
    expect(journey.isBlank).toBe(true)
    expect(journey.hasDestination).toBe(false)
    expect(journey.routeUrl).toBeNull()
  })

  test('スポットだけでも空のプランとして扱わない', () => {
    const journey = buildPlanJourney(emptyPlan, [
      buildSpot({ touringPlanSpotId: 'a' }),
    ])

    expect(journey.isBlank).toBe(false)
  })

  test('設定済みの出発地と目的地は破線にせず、経由地は破線にする', () => {
    const journey = buildPlanJourney(
      {
        startLocation: buildLocation({ name: '自宅' }),
        destinationLocation: buildLocation({ name: '沼津港' }),
      },
      [buildSpot({ touringPlanSpotId: 'a' })]
    )

    expect(journey.nodes.map((node) => node.isPending)).toEqual([
      false,
      true,
      false,
    ])
    expect(journey.nodes[0]?.name).toBe('自宅')
    expect(journey.nodes[2]?.name).toBe('沼津港')
  })

  test('空白だけの名前は名前なしとして扱う', () => {
    const journey = buildPlanJourney(emptyPlan, [
      buildSpot({ touringPlanSpotId: 'a', name: '   ' }),
    ])

    expect(journey.nodes[1]?.name).toBe('名もなきスポット')
  })

  test('出発地が未設定のうちは予定時刻と予定の長さを出さない', () => {
    const journey = buildPlanJourney(
      {
        startLocation: null,
        destinationLocation: buildLocation({
          plannedArrivalOffsetMinutes: 60,
          travelMinutesFromPrev: 60,
        }),
      },
      []
    )

    expect(journey.plannedMinutes).toBeNull()
    expect(formatPlanStayTime(journey.nodes[1]!)).toBeNull()
    expect(journey.legs[0]?.minutes).toBe(60)
  })

  test('スポット一覧の出発地と目的地をプラン詳細より優先する', () => {
    const journey = buildPlanJourney(
      {
        startLocation: buildLocation({ name: '古い出発地' }),
        destinationLocation: buildLocation({
          name: '古い目的地',
          plannedArrivalOffsetMinutes: 10,
        }),
      },
      [
        buildSpot({
          touringPlanSpotId: 's',
          type: 'START',
          name: '新しい出発地',
        }),
        buildSpot({
          touringPlanSpotId: 'd',
          type: 'DESTINATION',
          name: '新しい目的地',
          plannedArrivalOffsetMinutes: 90,
        }),
      ]
    )

    expect(journey.nodes.map((node) => node.name)).toEqual([
      '新しい出発地',
      '新しい目的地',
    ])
    expect(journey.plannedMinutes).toBe(90)
  })

  test('区間は到着側の移動時間と経路種別を持つ', () => {
    const journey = buildPlanJourney(
      { startLocation: buildLocation(), destinationLocation: null },
      [
        buildSpot({
          touringPlanSpotId: 'a',
          travelMinutesFromPrev: 45,
          routeTypeFromPrev: 'HIGHWAY',
        }),
      ]
    )

    expect(journey.legs[0]).toMatchObject({
      fromId: 'start',
      toId: 'a',
      minutes: 45,
      routeType: 'HIGHWAY',
    })
    expect(journey.legs[0]?.href).toContain('google.com/maps')
    expect(journey.legs[1]).toMatchObject({
      fromId: 'a',
      toId: 'destination',
      minutes: null,
      routeType: null,
      href: null,
    })
  })

  test('座標のない地点は経路に含めない', () => {
    const journey = buildPlanJourney(
      { startLocation: buildLocation(), destinationLocation: null },
      [
        buildSpot({
          touringPlanSpotId: 'a',
          latitude: null,
          longitude: null,
        }),
        buildSpot({ touringPlanSpotId: 'b' }),
      ]
    )

    expect(journey.routePoints).toHaveLength(2)
    expect(journey.legs[0]?.href).toBeNull()
  })

  test('目的地があれば到着までを予定の長さにする', () => {
    const journey = buildPlanJourney(
      {
        startLocation: buildLocation(),
        destinationLocation: buildLocation({
          plannedArrivalOffsetMinutes: 505,
        }),
      },
      []
    )

    expect(journey.plannedMinutes).toBe(505)
    expect(journey.hasDestination).toBe(true)
  })

  test('目的地がなければ最後の地点の出発までを予定の長さにする', () => {
    const journey = buildPlanJourney(
      { startLocation: buildLocation(), destinationLocation: null },
      [
        buildSpot({
          touringPlanSpotId: 'a',
          plannedDepartureOffsetMinutes: 80,
        }),
      ]
    )

    expect(journey.plannedMinutes).toBe(80)
    expect(journey.hasDestination).toBe(false)
  })

  test('石を左右交互に置く', () => {
    const journey = buildPlanJourney(emptyPlan, [
      buildSpot({ touringPlanSpotId: 'a' }),
    ])

    const summary = layoutJourney(journey).map((row) =>
      row.type === 'stop' ? `${row.node.id}:${row.side}` : row.type
    )

    expect(summary).toEqual([
      'start:left',
      'leg',
      'a:right',
      'leg',
      'destination:left',
    ])
  })
})

describe('formatPlanStayTime', () => {
  const nodeOf = (arrival: number | null, departure: number | null) =>
    buildPlanJourney(
      { startLocation: buildLocation(), destinationLocation: null },
      [
        buildSpot({
          touringPlanSpotId: 'a',
          plannedArrivalOffsetMinutes: arrival,
          plannedDepartureOffsetMinutes: departure,
        }),
      ]
    ).nodes[1]!

  test('滞在があれば到着と出発の範囲を返す', () => {
    expect(formatPlanStayTime(nodeOf(60, 90))).toBe(
      '出発から1時間後 〜 1時間30分後'
    )
  })

  test('滞在がなければ到着だけを返す', () => {
    expect(formatPlanStayTime(nodeOf(60, 60))).toBe('出発から1時間後に到着')
  })

  test('手前の移動時間が未入力なら返さない', () => {
    expect(formatPlanStayTime(nodeOf(null, null))).toBeNull()
  })

  test('経過0分は「出発時」と出す', () => {
    expect(formatPlanStayTime(nodeOf(0, 0))).toBe('出発時')
    expect(formatPlanStayTime(nodeOf(0, 30))).toBe('出発時 〜 30分後')
  })

  test('出発地には予定時刻を出さない', () => {
    const journey = buildPlanJourney(
      {
        startLocation: buildLocation({ plannedDepartureOffsetMinutes: 0 }),
        destinationLocation: null,
      },
      []
    )

    expect(formatPlanStayTime(journey.nodes[0]!)).toBeNull()
  })

  test('目的地は到着を返す', () => {
    const journey = buildPlanJourney(
      {
        startLocation: buildLocation(),
        destinationLocation: buildLocation({
          plannedArrivalOffsetMinutes: 505,
        }),
      },
      []
    )

    expect(formatPlanStayTime(journey.nodes[1]!)).toBe(
      '出発から8時間25分後に到着'
    )
  })
})

describe('一覧の表示', () => {
  const endpoint = (name: string | null) => ({
    latitude: 35,
    longitude: 139,
    name,
  })

  test('出発地と目的地の名前を矢印でつなぐ', () => {
    expect(
      formatPlanRoute({
        start: endpoint('自宅'),
        destination: endpoint('沼津港'),
      })
    ).toBe('自宅 → 沼津港')
  })

  test('名前がない地点は種類の名前で出す', () => {
    expect(
      formatPlanRoute({ start: endpoint(null), destination: endpoint(null) })
    ).toBe('出発地 → 目的地')
  })

  test('未設定の側は未定と出す', () => {
    expect(
      formatPlanRoute({ start: endpoint('自宅'), destination: null })
    ).toBe('自宅 → 目的地未定')
    expect(
      formatPlanRoute({ start: null, destination: endpoint('沼津港') })
    ).toBe('出発地未定 → 沼津港')
  })

  test('どちらも未設定なら決まっていないと出す', () => {
    expect(formatPlanRoute({ start: null, destination: null })).toBe(
      '行き先はまだ決まっていません'
    )
  })

  test('座標のある地点だけを経路の順に並べる', () => {
    expect(
      getPlanListRoutePoints({
        start: { latitude: 1, longitude: 1, name: null },
        stops: [
          { type: 'SPOT', latitude: null, longitude: null },
          { type: 'BREAK', latitude: 2, longitude: 2 },
        ],
        destination: { latitude: 3, longitude: 3, name: null },
      })
    ).toEqual([
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ])
  })

  test('石の大きさは予定の長さに応じて上限と下限に収まる', () => {
    expect(getPlanStoneWidth(null)).toBe(60)
    expect(getPlanStoneWidth(0)).toBe(56)
    expect(getPlanStoneWidth(60)).toBe(60)
    expect(getPlanStoneWidth(10_000)).toBe(84)
  })

  test('小石の形へ変換するとスキップ・到着なしになる', () => {
    expect(
      toPlanPebbleStops([{ type: 'SPOT', latitude: 1, longitude: 2 }])
    ).toEqual([
      {
        type: 'SPOT',
        latitude: 1,
        longitude: 2,
        isSkipped: false,
        hasArrived: false,
      },
    ])
  })
})
