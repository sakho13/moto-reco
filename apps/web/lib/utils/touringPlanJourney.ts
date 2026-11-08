import type {
  ApiResponseTouringPlanDetail,
  ApiResponseTouringPlanListItem,
  ApiResponseTouringPlanLocation,
  ApiResponseTouringPlanSpotDetail,
  ApiResponseTouringStop,
  TouringPlanRouteType,
} from '@repo/shared-types'
import { formatPlanSpotOffsetMinutes } from '@repo/shared-utils'
import {
  buildGoogleMapsRouteUrl,
  buildGoogleMapsTwoPointUrl,
} from './googleMaps'
import type {
  Journey,
  JourneyLeg,
  JourneyNode,
  JourneyPoint,
} from './touringJourney'
import {
  clamp,
  formatDuration,
  STAY_NAME_FALLBACK,
  toPoint,
} from './touringJourney'

export const TOURING_PLAN_ROUTE_TYPE_LABELS: Record<
  TouringPlanRouteType,
  string
> = {
  GENERAL: '下道',
  HIGHWAY: '高速',
  MIXED: '混在',
}

export type PlanJourney = Journey & {
  /** 出発から目的地（未設定なら最後の地点の出発）までの予定分数 */
  plannedMinutes: number | null
  hasDestination: boolean
  /** 出発地・目的地・経由地のどれも決まっていない */
  isBlank: boolean
}

type PlanLocation = Pick<
  ApiResponseTouringPlanLocation,
  | 'latitude'
  | 'longitude'
  | 'name'
  | 'memo'
  | 'stayMinutes'
  | 'travelMinutesFromPrev'
  | 'routeTypeFromPrev'
  | 'plannedArrivalOffsetMinutes'
  | 'plannedDepartureOffsetMinutes'
>

const nameOr = (name: string | null | undefined, fallback: string): string =>
  name?.trim() ? name : fallback

const buildNode = (
  location: PlanLocation | null,
  hasStart: boolean,
  overrides: Pick<JourneyNode, 'id' | 'kind' | 'mark' | 'name' | 'isPending'>
): JourneyNode => ({
  memo: location?.memo ?? null,
  mileage: null,
  point: toPoint(location?.latitude, location?.longitude),
  arrivedAt: null,
  departedAt: null,
  plannedArrivalAt: null,
  skippedAt: null,
  stayMinutes: location?.stayMinutes ?? null,
  isCurrent: false,
  isLongestStay: false,
  spot: null,
  plannedOffset:
    location && hasStart
      ? {
          arrival: location.plannedArrivalOffsetMinutes,
          departure: location.plannedDepartureOffsetMinutes,
        }
      : null,
  isUnset: location === null,
  ...overrides,
})

const getPlannedMinutes = (
  middleSpots: PlanLocation[],
  destination: PlanLocation | null
): number | null => {
  if (destination) return destination.plannedArrivalOffsetMinutes
  return middleSpots.at(-1)?.plannedDepartureOffsetMinutes ?? null
}

/**
 * プラン詳細とスポット一覧から、道のりの表示に使う情報を組み立てる
 *
 * @remarks
 * まだ走っていないので、経由地はすべて破線の石（`isPending`）で出す。
 * 出発地と目的地は未設定でも行を残し、決める操作の置き場所にする。
 * スポット一覧の到着予定を優先し、取得前はプラン詳細の出発地・目的地を使う。
 * 出発地が未設定のうちは、最初の区間の移動時間を起点に足せないので予定時刻を出さない。
 */
export function buildPlanJourney(
  plan: Pick<
    ApiResponseTouringPlanDetail,
    'startLocation' | 'destinationLocation'
  >,
  spots: ApiResponseTouringPlanSpotDetail[]
): PlanJourney {
  const start =
    spots.find((spot) => spot.type === 'START') ?? plan.startLocation
  const destination =
    spots.find((spot) => spot.type === 'DESTINATION') ??
    plan.destinationLocation
  const middleSpots = spots.filter(
    (spot) => spot.type === 'SPOT' || spot.type === 'BREAK'
  )

  const hasStart = start !== null

  let spotNumber = 0
  const nodes: JourneyNode[] = [
    buildNode(start, hasStart, {
      id: 'start',
      kind: 'start',
      mark: '出',
      name: nameOr(start?.name, '出発地'),
      isPending: start === null,
    }),
    ...middleSpots.map((spot) => {
      const isBreak = spot.type === 'BREAK'
      if (!isBreak) spotNumber += 1
      return buildNode(spot, hasStart, {
        id: spot.touringPlanSpotId,
        kind: isBreak ? ('break' as const) : ('spot' as const),
        mark: isBreak ? '休' : String(spotNumber),
        name: nameOr(spot.name, STAY_NAME_FALLBACK[isBreak ? 'BREAK' : 'SPOT']),
        isPending: true,
      })
    }),
    buildNode(destination, hasStart, {
      id: 'destination',
      kind: 'end',
      mark: '着',
      name: nameOr(destination?.name, '目的地'),
      isPending: destination === null,
    }),
  ]

  const toLocations = [...middleSpots, destination]
  const legs: JourneyLeg[] = nodes.slice(1).map((to, index) => {
    const from = nodes[index]!
    const location = toLocations[index] ?? null
    const routeType = location?.routeTypeFromPrev ?? null
    return {
      fromId: from.id,
      toId: to.id,
      minutes: location?.travelMinutesFromPrev ?? null,
      href:
        from.point && to.point
          ? buildGoogleMapsTwoPointUrl(from.point, to.point, routeType)
          : null,
      isLongest: false,
      dayNumber: null,
      routeType,
    }
  })

  const routePoints = nodes
    .map((node) => node.point)
    .filter((point): point is JourneyPoint => point !== null)

  return {
    nodes,
    legs,
    hereAfterId: null,
    spotCount: spotNumber,
    breakCount: middleSpots.length - spotNumber,
    distance: null,
    routePoints,
    routeUrl: buildGoogleMapsRouteUrl(routePoints),
    plannedMinutes: hasStart
      ? getPlannedMinutes(middleSpots, destination)
      : null,
    hasDestination: destination !== null,
    isBlank: start === null && destination === null && middleSpots.length === 0,
  }
}

/**
 * 地点の予定時刻。滞在があれば `出発から1時間後 〜 1時間30分後`、なければ到着だけを返す
 *
 * @returns 出発地、または手前の移動時間が未入力で計算できないときは `null`
 */
export const formatPlanStayTime = (node: JourneyNode): string | null => {
  if (node.kind === 'start' || !node.plannedOffset) return null

  const { arrival, departure } = node.plannedOffset
  if (arrival === null) return null

  const arrivalLabel = formatPlanSpotOffsetMinutes(arrival)
  if (departure === null || departure === arrival) {
    return arrival === 0 ? arrivalLabel : `${arrivalLabel}に到着`
  }
  return `${arrivalLabel} 〜 ${formatDuration(departure)}後`
}

/** 一覧の行で使う、出発地から目的地までの座標 */
export const getPlanListRoutePoints = (
  plan: Pick<ApiResponseTouringPlanListItem, 'start' | 'stops' | 'destination'>
): JourneyPoint[] =>
  [plan.start, ...plan.stops, plan.destination]
    .map((location) => toPoint(location?.latitude, location?.longitude))
    .filter((point): point is JourneyPoint => point !== null)

/** 一覧の石の幅（px）。予定が長いほど大きい */
export const getPlanStoneWidth = (plannedMinutes: number | null): number =>
  plannedMinutes === null
    ? 60
    : Math.round(clamp(56 + plannedMinutes * 0.06, 56, 84))

/** 一覧の小石に渡す形へ変換する */
export const toPlanPebbleStops = (
  stops: ApiResponseTouringPlanListItem['stops']
): ApiResponseTouringStop[] =>
  stops.map((stop) => ({ ...stop, isSkipped: false, hasArrived: false }))

/** `自宅 → 沼津港`。未設定の側は「未定」と出す */
export const formatPlanRoute = (
  plan: Pick<ApiResponseTouringPlanListItem, 'start' | 'destination'>
): string => {
  if (!plan.start && !plan.destination) return '行き先はまだ決まっていません'
  const start = plan.start ? nameOr(plan.start.name, '出発地') : '出発地未定'
  const destination = plan.destination
    ? nameOr(plan.destination.name, '目的地')
    : '目的地未定'
  return `${start} → ${destination}`
}
