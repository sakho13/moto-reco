import type {
  ApiResponseSpotDetail,
  ApiResponseTouringDetail,
  ApiResponseTouringStop,
} from '@repo/shared-types'
import {
  buildGoogleMapsRouteUrl,
  buildGoogleMapsTwoPointUrl,
  calcTravelMinutes,
} from './googleMaps'

export type JourneyPoint = { lat: number; lng: number }

export type JourneyNodeKind = 'start' | 'spot' | 'break' | 'skip' | 'end'

/** 道のりの1地点（出発地・スポット・休憩・終着地） */
export type JourneyNode = {
  id: string
  kind: JourneyNodeKind
  /** 石と地図のピンに共通で出す印（出・番号・休・不・着） */
  mark: string
  name: string
  memo: string | null
  /** 出発地と終着地のメーター値 */
  mileage: number | null
  point: JourneyPoint | null
  arrivedAt: string | null
  departedAt: string | null
  plannedArrivalAt: string | null
  skippedAt: string | null
  stayMinutes: number | null
  /** 進行中のツーリングで、まだ着いていない地点 */
  isPending: boolean
  /** 進行中のツーリングで、いま滞在している地点 */
  isCurrent: boolean
  isLongestStay: boolean
  spot: ApiResponseSpotDetail | null
}

/** スキップを除いた、隣り合う2地点の区間 */
export type JourneyLeg = {
  fromId: string
  toId: string
  minutes: number | null
  /** 両端に座標があるときのGoogleマップ経路URL */
  href: string | null
  isLongest: boolean
  /** この区間で日付が変わるときの、到着側の日数（2日目なら2） */
  dayNumber: number | null
}

export type Journey = {
  nodes: JourneyNode[]
  legs: JourneyLeg[]
  /** 走行中の現在地を置く区間の起点。滞在中や完了時はnull */
  hereAfterId: string | null
  /** 寄り道の数（スキップと未到達を除くスポット） */
  spotCount: number
  /** 休憩の回数（スキップと未到達を除く） */
  breakCount: number
  distance: number | null
  /** スキップを除いた地図の経路 */
  routePoints: JourneyPoint[]
  routeUrl: string | null
}

const STAY_NAME_FALLBACK = {
  SPOT: '名もなきスポット',
  BREAK: '休憩',
} as const

const toPoint = (
  latitude: number | null | undefined,
  longitude: number | null | undefined
): JourneyPoint | null =>
  latitude != null && longitude != null
    ? { lat: latitude, lng: longitude }
    : null

export const getTouringDistance = (touring: {
  startMileage: number | null
  endMileage: number | null
}): number | null =>
  touring.startMileage !== null && touring.endMileage !== null
    ? touring.endMileage - touring.startMileage
    : null

/** 進行中は終着地の座標があるときだけ、完了済みは常に終着地を出す */
const shouldShowDestination = (touring: {
  status: ApiResponseTouringDetail['status']
  endLatitude: number | null
}): boolean => touring.status === 'COMPLETED' || touring.endLatitude != null

const localDayStart = (iso: string): number => {
  const date = new Date(iso)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const dayIndexOf = (startIso: string, iso: string): number =>
  Math.round((localDayStart(iso) - localDayStart(startIso)) / 86_400_000) + 1

/** 進行中は、着いていない地点を後ろへ送る。休憩は記録順で末尾に保存されるため */
const moveUnreachedLast = <T>(
  items: T[],
  isUnreached: (item: T) => boolean
): T[] => [
  ...items.filter((item) => !isUnreached(item)),
  ...items.filter(isUnreached),
]

/** 一覧の小石と経路に使う、表示順の地点 */
export const orderTouringStops = (
  stops: ApiResponseTouringStop[],
  status: ApiResponseTouringDetail['status']
): ApiResponseTouringStop[] =>
  status === 'STARTED'
    ? moveUnreachedLast(stops, (stop) => !stop.isSkipped && !stop.hasArrived)
    : stops

const markLongest = <T>(
  items: T[],
  getValue: (item: T) => number | null,
  apply: (item: T) => void
): void => {
  const measured = items.filter((item) => getValue(item) !== null)
  if (measured.length < 2) return
  const max = Math.max(...measured.map((item) => getValue(item) ?? 0))
  const longest = measured.filter((item) => getValue(item) === max)
  if (longest.length === 1) apply(longest[0]!)
}

/**
 * ツーリング詳細とスポット一覧から、道のりの表示に使う情報を組み立てる
 *
 * @remarks
 * 番号はスキップを除いたスポットに順に振る。休憩は番号を持たない。
 * スキップ地点は `nodes` に残すが、区間と経路には含めない。
 * 進行中は着いた地点を先に並べるので、`nodes` の順が保存順と異なることがある。
 */
export function buildJourney(
  touring: ApiResponseTouringDetail,
  spots: ApiResponseSpotDetail[]
): Journey {
  const isStarted = touring.status === 'STARTED'
  const nodes: JourneyNode[] = []

  nodes.push({
    id: 'start',
    kind: 'start',
    mark: '出',
    name: '出発地',
    memo: null,
    mileage: touring.startMileage,
    point: toPoint(touring.startLatitude, touring.startLongitude),
    arrivedAt: null,
    departedAt: touring.startDate,
    plannedArrivalAt: null,
    skippedAt: null,
    stayMinutes: null,
    isPending: false,
    isCurrent: false,
    isLongestStay: false,
    spot: null,
  })

  let spotNumber = 0
  let spotCount = 0
  let breakCount = 0

  const orderedSpots = isStarted
    ? moveUnreachedLast(
        spots,
        (spot) => !spot.isSkipped && spot.arrivedAt === null
      )
    : spots

  for (const spot of orderedSpots) {
    const isVisited = !spot.isSkipped && (!isStarted || spot.arrivedAt !== null)
    const isBreak = spot.type === 'BREAK'
    let mark = '休'
    if (spot.isSkipped) {
      mark = '不'
    } else if (!isBreak) {
      spotNumber += 1
      mark = String(spotNumber)
    }
    if (isVisited && isBreak) breakCount += 1
    if (isVisited && !isBreak) spotCount += 1

    let kind: JourneyNodeKind = isBreak ? 'break' : 'spot'
    if (spot.isSkipped) kind = 'skip'

    nodes.push({
      id: spot.spotId,
      kind,
      mark,
      name: spot.name ?? STAY_NAME_FALLBACK[spot.type],
      memo: spot.memo,
      mileage: null,
      point: toPoint(spot.latitude, spot.longitude),
      arrivedAt: spot.arrivedAt,
      departedAt: spot.departedAt,
      plannedArrivalAt: spot.plannedArrivalAt,
      skippedAt: spot.skippedAt,
      stayMinutes: spot.isSkipped
        ? null
        : calcTravelMinutes(spot.arrivedAt, spot.departedAt),
      isPending: isStarted && !spot.isSkipped && spot.arrivedAt === null,
      isCurrent: false,
      isLongestStay: false,
      spot,
    })
  }

  if (shouldShowDestination(touring)) {
    nodes.push({
      id: 'destination',
      kind: 'end',
      mark: '着',
      name: '終着地',
      memo: null,
      mileage: touring.endMileage,
      point: toPoint(touring.endLatitude, touring.endLongitude),
      arrivedAt: isStarted ? null : touring.endDate,
      departedAt: null,
      plannedArrivalAt: null,
      skippedAt: null,
      stayMinutes: null,
      isPending: isStarted,
      isCurrent: false,
      isLongestStay: false,
      spot: null,
    })
  }

  markLongest(
    nodes.filter((node) => node.kind === 'spot'),
    (node) => node.stayMinutes,
    (node) => {
      node.isLongestStay = true
    }
  )

  const onRoute = nodes.filter((node) => node.kind !== 'skip')
  const legs: JourneyLeg[] = []
  let lastDayIndex = 1

  // 完了済みで期間の外にある時刻は誤入力とみなし、移動時間や日数の計算に使わない
  const isWithinTouring = (iso: string | null): boolean =>
    iso !== null &&
    (isStarted ||
      (new Date(iso) >= new Date(touring.startDate) &&
        new Date(iso) <= new Date(touring.endDate)))

  onRoute.slice(1).forEach((to, index) => {
    const from = onRoute[index]!
    const arrivedAt = isWithinTouring(to.arrivedAt) ? to.arrivedAt : null
    const departedAt = isWithinTouring(from.departedAt) ? from.departedAt : null
    let dayNumber: number | null = null
    if (arrivedAt) {
      const dayIndex = dayIndexOf(touring.startDate, arrivedAt)
      if (dayIndex > lastDayIndex) {
        dayNumber = dayIndex
        lastDayIndex = dayIndex
      }
    }
    legs.push({
      fromId: from.id,
      toId: to.id,
      minutes: calcTravelMinutes(departedAt, arrivedAt),
      href:
        from.point && to.point
          ? buildGoogleMapsTwoPointUrl(from.point, to.point)
          : null,
      isLongest: false,
      dayNumber,
    })
  })

  markLongest(
    legs,
    (leg) => leg.minutes,
    (leg) => {
      leg.isLongest = true
    }
  )

  let hereAfterId: string | null = null
  if (isStarted) {
    const reached = onRoute.filter((node) => !node.isPending)
    const last = reached.at(-1)!
    if (last.kind !== 'start' && last.departedAt === null) {
      last.isCurrent = true
    } else {
      hereAfterId = last.id
    }
  }

  const routePoints = onRoute
    .map((node) => node.point)
    .filter((point): point is JourneyPoint => point !== null)

  return {
    nodes,
    legs,
    hereAfterId,
    spotCount,
    breakCount,
    distance: getTouringDistance(touring),
    routePoints,
    routeUrl: buildGoogleMapsRouteUrl(routePoints),
  }
}

export type JourneySide = 'left' | 'right'

/** 道のりの描画順に並べた行 */
export type JourneyRow =
  | { type: 'stop'; node: JourneyNode; side: JourneySide; hasTrail: boolean }
  | { type: 'skip'; node: JourneyNode; roadSide: JourneySide }
  | {
      type: 'leg'
      leg: JourneyLeg
      fromSide: JourneySide
      toSide: JourneySide
      showsHere: boolean
    }
  | { type: 'tail'; fromSide: JourneySide; showsHere: boolean }

/**
 * 地点と区間を、左右に振り分けた描画順の行へ並べ替える
 *
 * @remarks
 * 石は訪れた順に左右交互に置く。スキップ地点は道の向かい側に置き、道は曲げない。
 * 進行中で次の地点がないときは、道の終わりに `tail` の行を足す。
 */
export function layoutJourney(journey: Journey): JourneyRow[] {
  const rows: JourneyRow[] = []
  let side: JourneySide = 'left'

  journey.nodes.forEach((node, index) => {
    if (node.kind === 'skip') return

    const nextNodes = journey.nodes.slice(index + 1)
    const nextStop = nextNodes.find((n) => n.kind !== 'skip')
    const needsTail = !nextStop && journey.hereAfterId === node.id
    rows.push({
      type: 'stop',
      node,
      side,
      hasTrail: nextNodes.length > 0 || needsTail,
    })

    const nextSide: JourneySide = side === 'left' ? 'right' : 'left'
    const skipsAfter = nextStop
      ? nextNodes.slice(0, nextNodes.indexOf(nextStop))
      : nextNodes
    for (const skip of skipsAfter) {
      rows.push({ type: 'skip', node: skip, roadSide: side })
    }

    if (nextStop) {
      const leg = journey.legs.find((l) => l.fromId === node.id)!
      rows.push({
        type: 'leg',
        leg,
        fromSide: side,
        toSide: nextSide,
        showsHere: journey.hereAfterId === node.id,
      })
    } else if (needsTail) {
      rows.push({ type: 'tail', fromSide: side, showsHere: true })
    }
    side = nextSide
  })

  return rows
}

const STONE_SHAPES = [
  '48% 52% 56% 44% / 52% 46% 54% 48%',
  '58% 42% 55% 45% / 48% 56% 44% 52%',
  '52% 48% 42% 58% / 60% 44% 56% 40%',
  '46% 54% 60% 40% / 55% 44% 56% 45%',
  '50% 50% 44% 56% / 56% 46% 54% 44%',
  '60% 40% 48% 52% / 46% 58% 42% 54%',
  '50% 50% 38% 62% / 58% 48% 52% 42%',
  '44% 56% 50% 50% / 56% 52% 48% 44%',
] as const

/** IDから石の形を決める。並び替えても同じ地点は同じ形のままになる */
export const getStoneShape = (id: string): string => {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return STONE_SHAPES[hash % STONE_SHAPES.length]!
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/** 石の幅（px）。スポットは滞在時間が長いほど大きい。高さは幅の95% */
export const getStoneWidth = (node: JourneyNode): number => {
  switch (node.kind) {
    case 'start':
      return 56
    case 'end':
      return 64
    case 'break':
    case 'skip':
      return 54
    case 'spot':
      return node.stayMinutes === null
        ? 68
        : Math.round(clamp(60 + (node.stayMinutes - 10) * 0.7, 60, 88))
  }
}

/** 区間の高さ（px）。移動時間が長いほど石の間隔が開く */
export const getLegHeight = (minutes: number | null): number =>
  minutes === null ? 56 : Math.round(clamp(44 + minutes * 0.35, 48, 96))

/** 一覧の石の幅（px）。走行距離が長いほど大きい */
export const getTouringStoneWidth = (distance: number | null): number =>
  distance === null ? 60 : Math.round(clamp(56 + distance * 0.1, 56, 84))

/**
 * 緯度経度を、縦横比を保ったまま指定サイズのSVG座標へ投影する
 *
 * @returns 2点未満、またはすべて同じ地点のときは空配列
 */
export function projectRoute(
  points: JourneyPoint[],
  width: number,
  height: number,
  padding: number
): { x: number; y: number }[] {
  if (points.length < 2) return []

  const meanLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length
  const lngScale = Math.cos((meanLat * Math.PI) / 180)
  const xs = points.map((p) => p.lng * lngScale)
  const ys = points.map((p) => -p.lat)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const spanX = Math.max(...xs) - minX
  const spanY = Math.max(...ys) - minY
  if (spanX === 0 && spanY === 0) return []

  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  const scale = Math.min(
    spanX > 0 ? innerWidth / spanX : Infinity,
    spanY > 0 ? innerHeight / spanY : Infinity
  )
  const offsetX = (width - spanX * scale) / 2
  const offsetY = (height - spanY * scale) / 2
  const round = (value: number) => Math.round(value * 10) / 10

  return xs.map((x, index) => ({
    x: round(offsetX + (x - minX) * scale),
    y: round(offsetY + (ys[index]! - minY) * scale),
  }))
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

const pad = (value: number): string => String(value).padStart(2, '0')

/** ローカル時刻の `HH:mm` */
export const formatClock = (iso: string): string => {
  const date = new Date(iso)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** `45分` / `2時間` / `1時間50分` */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}分`
  return rest === 0 ? `${hours}時間` : `${hours}時間${rest}分`
}

/** `10月18日（日）` */
export const formatMonthDay = (iso: string): string => {
  const date = new Date(iso)
  return `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS[date.getDay()]}）`
}

/** ツーリングの日付。進行中は開始日のみ、日をまたぐ場合は範囲で返す */
export const formatTouringDate = (touring: {
  startDate: string
  endDate: string
  status: ApiResponseTouringDetail['status']
}): string => {
  const start = new Date(touring.startDate)
  const startLabel = `${start.getFullYear()}年${formatMonthDay(touring.startDate)}`
  if (touring.status === 'STARTED') return startLabel
  if (localDayStart(touring.startDate) === localDayStart(touring.endDate)) {
    return startLabel
  }
  const end = new Date(touring.endDate)
  const endLabel =
    end.getFullYear() === start.getFullYear()
      ? formatMonthDay(touring.endDate)
      : `${end.getFullYear()}年${formatMonthDay(touring.endDate)}`
  return `${startLabel} 〜 ${endLabel}`
}

/** 地点の時刻。滞在は `08:30 – 09:05`、片方だけなら `08:30 着` / `09:05 発` */
export const formatStayTime = (node: JourneyNode): string | null => {
  if (node.kind === 'start') {
    return node.departedAt ? formatClock(node.departedAt) : null
  }
  if (node.kind === 'end') {
    return node.arrivedAt ? formatClock(node.arrivedAt) : null
  }
  if (node.arrivedAt && node.departedAt) {
    return `${formatClock(node.arrivedAt)} – ${formatClock(node.departedAt)}`
  }
  if (node.arrivedAt) return `${formatClock(node.arrivedAt)} 着`
  if (node.departedAt) return `${formatClock(node.departedAt)} 発`
  return null
}

/** 一覧の行で使う、スキップを除いた経路の座標 */
export const getListRoutePoints = (touring: {
  status: ApiResponseTouringDetail['status']
  startLatitude: number | null
  startLongitude: number | null
  endLatitude: number | null
  endLongitude: number | null
  stops: ApiResponseTouringStop[]
}): JourneyPoint[] => {
  const points = [
    toPoint(touring.startLatitude, touring.startLongitude),
    ...orderTouringStops(touring.stops, touring.status)
      .filter((stop) => !stop.isSkipped)
      .map((stop) => toPoint(stop.latitude, stop.longitude)),
    shouldShowDestination(touring)
      ? toPoint(touring.endLatitude, touring.endLongitude)
      : null,
  ]
  return points.filter((point): point is JourneyPoint => point !== null)
}

export type TouringMonthGroup<T> = {
  key: string
  label: string
  items: T[]
  totalDistance: number
}

/**
 * 並び順を保ったまま、連続する同じ月のツーリングをまとめる
 *
 * @remarks
 * 進行中のツーリングは月に関わらず先頭の「走行中」にまとめる。
 */
export function groupTouringsByMonth<
  T extends {
    startDate: string
    status: ApiResponseTouringDetail['status']
    startMileage: number | null
    endMileage: number | null
  },
>(tourings: T[]): TouringMonthGroup<T>[] {
  const groups: TouringMonthGroup<T>[] = []
  const started = tourings.filter((touring) => touring.status === 'STARTED')
  if (started.length > 0) {
    groups.push({
      key: 'started',
      label: '走行中',
      items: started,
      totalDistance: 0,
    })
  }

  for (const touring of tourings) {
    if (touring.status === 'STARTED') continue
    const date = new Date(touring.startDate)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    let group = groups.at(-1)
    if (group?.key !== key) {
      group = {
        key,
        label: `${date.getFullYear()}年${date.getMonth() + 1}月`,
        items: [],
        totalDistance: 0,
      }
      groups.push(group)
    }
    group.items.push(touring)
    group.totalDistance += getTouringDistance(touring) ?? 0
  }

  return groups
}
