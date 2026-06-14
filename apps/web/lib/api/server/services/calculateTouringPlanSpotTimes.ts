import { TouringPlanSpotType } from '@repo/shared-types'

type SpotTimeInput = {
  type: TouringPlanSpotType
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
}

type SpotTimeResult = {
  plannedArrivalOffsetMinutes: number | null
  plannedDepartureOffsetMinutes: number | null
}

/**
 * 出発(START)を0分とした経過分数を基準に、各スポットの予定到着・予定出発までの
 * 経過分数をチェイン計算する。
 *
 * @remarks
 * `orderedSpots` は `START → SPOT/BREAK(sortOrder順) → DESTINATION` の順で渡すこと。
 *
 * アルゴリズム:
 * 1. `currentOffset` を `0`（出発(START)の出発時刻）で初期化する。
 * 2. 各スポットについて、種別に応じて到着・出発までの経過分数を決定する。
 *    - `DESTINATION`: 到着までの経過分数 = `currentOffset`、出発までの経過分数は常に `null`。
 *      これ以降のスポットは存在しないためループを終了する。
 *    - `START`: 到着までの経過分数は常に `null`、出発までの経過分数 = `currentOffset`（常に`0`）。
 *    - `SPOT` / `BREAK`: 到着までの経過分数 = `currentOffset`、
 *      出発までの経過分数 = `currentOffset + stayMinutes`（`stayMinutes` が未設定の場合は0分扱い）。
 *      ただし `currentOffset` が `null` の場合は出発までの経過分数も `null`。
 * 3. 次のスポットへ移動するための `currentOffset` を更新する。
 *    次のスポットの `travelMinutesFromPrev`（次のスポットから見た自分への移動時間）が
 *    未設定、または現在の出発までの経過分数が `null` の場合、以降の `currentOffset` は
 *    `null` となり、それ以降のすべてのスポットの到着・出発までの経過分数が `null` になる。
 *
 * @param orderedSpots - `START → SPOT/BREAK → DESTINATION` の順に並んだスポット情報
 * @returns `orderedSpots` と同じ長さ・同じ順序の、予定到着・予定出発までの経過分数の配列
 */
export function calculateTouringPlanSpotTimes(
  orderedSpots: SpotTimeInput[]
): SpotTimeResult[] {
  const results: SpotTimeResult[] = []

  // STARTの出発(=プラン開始)を0分とする
  let currentOffset: number | null = 0

  for (let i = 0; i < orderedSpots.length; i++) {
    const spot = orderedSpots[i]
    if (!spot) continue

    if (spot.type === 'DESTINATION') {
      results.push({
        plannedArrivalOffsetMinutes: currentOffset,
        plannedDepartureOffsetMinutes: null,
      })
      break
    }

    let arrivalOffset: number | null
    let departureOffset: number | null

    if (spot.type === 'START') {
      arrivalOffset = null
      departureOffset = currentOffset
    } else {
      // SPOT / BREAK
      arrivalOffset = currentOffset
      departureOffset =
        currentOffset !== null ? currentOffset + (spot.stayMinutes ?? 0) : null
    }

    results.push({
      plannedArrivalOffsetMinutes: arrivalOffset,
      plannedDepartureOffsetMinutes: departureOffset,
    })

    // 次の地点への移動時間を加算し、次ループの currentOffset を確定する
    const nextSpot = orderedSpots[i + 1]
    const nextTravelMinutes = nextSpot?.travelMinutesFromPrev ?? null

    currentOffset =
      departureOffset !== null && nextTravelMinutes !== null
        ? departureOffset + nextTravelMinutes
        : null
  }

  return results
}
