import { TouringPlanSpotType } from '@repo/shared-types'

const MINUTE_IN_MS = 60 * 1000

type SpotTimeInput = {
  type: TouringPlanSpotType
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
}

type SpotTimeResult = {
  plannedArrivalAt: Date | null
  plannedDepartureAt: Date | null
}

/**
 * プランスポットの予定時刻計算における固定の基準時刻。
 *
 * @remarks
 * ツーリングプラン自体は出発予定日時を持たないため、各スポットの
 * `plannedArrivalAt`/`plannedDepartureAt` はこの基準時刻からの経過時間として
 * 計算・保存される。「このプランで開始する」操作時には、この基準時刻からの
 * 経過時間を実際のツーリング開始時刻に再アンカーして実績スポットへコピーする。
 */
export const PLAN_SPOT_TIME_BASE_DATE = new Date('2000-01-01T00:00:00+09:00')

/**
 * `departAt` を起点に、各スポットの予定到着時刻・予定出発時刻をチェイン計算する。
 *
 * @remarks
 * `orderedSpots` は `START → SPOT/BREAK(sortOrder順) → DESTINATION` の順で渡すこと。
 *
 * アルゴリズム:
 * 1. `currentTime` を `departAt` で初期化する。
 * 2. 各スポットについて、種別に応じて到着・出発時刻を決定する。
 *    - `DESTINATION`: 到着時刻 = `currentTime`、出発時刻は常に `null`。
 *      これ以降のスポットは存在しないためループを終了する。
 *    - `START`: 到着時刻は常に `null`、出発時刻 = `currentTime`。
 *    - `SPOT` / `BREAK`: 到着時刻 = `currentTime`、
 *      出発時刻 = `currentTime + stayMinutes`分（`stayMinutes` が未設定の場合は0分扱い）。
 *      ただし `currentTime` が `null` の場合は出発時刻も `null`。
 * 3. 次のスポットへ移動するための `currentTime` を更新する。
 *    次のスポットの `travelMinutesFromPrev`（次のスポットから見た自分への移動時間）が
 *    未設定、または現在の出発時刻が `null` の場合、以降の `currentTime` は `null` となり、
 *    それ以降のすべてのスポットの到着・出発時刻が `null` になる。
 *
 * @param departAt - 経過時間計算の起点となる時刻（呼び出し元は固定の基準時刻
 * {@link PLAN_SPOT_TIME_BASE_DATE} を渡すこと）。各スポットの計算結果は
 * この時刻からの経過時間を表す値になる。
 * @param orderedSpots - `START → SPOT/BREAK → DESTINATION` の順に並んだスポット情報
 * @returns `orderedSpots` と同じ長さ・同じ順序の、予定到着時刻・予定出発時刻の配列
 */
export function calculateTouringPlanSpotTimes(
  departAt: Date,
  orderedSpots: SpotTimeInput[]
): SpotTimeResult[] {
  const results: SpotTimeResult[] = []

  let currentTime: Date | null = departAt

  for (let i = 0; i < orderedSpots.length; i++) {
    const spot = orderedSpots[i]
    if (!spot) continue

    if (spot.type === 'DESTINATION') {
      results.push({ plannedArrivalAt: currentTime, plannedDepartureAt: null })
      break
    }

    let plannedArrivalAt: Date | null
    let plannedDepartureAt: Date | null

    if (spot.type === 'START') {
      plannedArrivalAt = null
      plannedDepartureAt = currentTime
    } else {
      // SPOT / BREAK
      plannedArrivalAt = currentTime
      plannedDepartureAt =
        currentTime !== null
          ? new Date(
              currentTime.getTime() + (spot.stayMinutes ?? 0) * MINUTE_IN_MS
            )
          : null
    }

    results.push({ plannedArrivalAt, plannedDepartureAt })

    // 次の地点への移動時間を加算し、次ループの currentTime を確定する
    const nextSpot = orderedSpots[i + 1]
    const nextTravelMinutes = nextSpot?.travelMinutesFromPrev ?? null

    currentTime =
      plannedDepartureAt !== null && nextTravelMinutes !== null
        ? new Date(
            plannedDepartureAt.getTime() + nextTravelMinutes * MINUTE_IN_MS
          )
        : null
  }

  return results
}
