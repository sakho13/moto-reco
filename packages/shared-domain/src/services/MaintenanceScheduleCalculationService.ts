import type {
  MaintenanceItem,
  MaintenanceScheduleBasis,
  MaintenanceScheduleForecast,
  MaintenanceScheduleLastRecord,
  MaintenanceScheduleStatus,
  MaintenanceType,
} from '@repo/shared-types'

/** 1日のミリ秒数 */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * 進捗率（経過分 ÷ 推奨間隔）がこの値以上になったら「まもなく」と判定する。
 * 例: 推奨間隔3000kmの項目で前回から2400km以上経過（80%消化）していたら対象。
 */
const UPCOMING_THRESHOLD_RATIO = 0.8

/**
 * 点検予定の算出対象となるメンテナンス項目マスタ情報
 *
 * @remarks
 * #151（メンテナンス項目マスタのDB管理化）が完了した場合、呼び出し側が
 * 定数（`MAINTENANCE_ITEMS_MASTER`）の代わりにリポジトリから組み立てて
 * 渡せばよく、このサービス自体の変更は不要な設計としている。
 */
export type MaintenanceScheduleMasterItem = Pick<
  MaintenanceItem,
  | 'type'
  | 'category'
  | 'typeName'
  | 'categoryName'
  | 'recommendedMileageInterval'
  | 'recommendedPeriodMonths'
>

/**
 * 整備記録の要約
 *
 * @remarks
 * 1件の整備記録に複数のメンテナンス項目が紐づき得るため `types` は配列。
 */
export type MaintenanceScheduleLogSummary = {
  performedAt: Date
  mileage: number
  types: readonly MaintenanceType[]
}

export type MaintenanceScheduleCalculationInput = {
  /** 車両の現在の総走行距離（km） */
  currentMileage: number
  /** 算出基準時刻（テスト容易性のため呼び出し側から注入する） */
  now: Date
  /** 算出対象のメンテナンス項目マスタ一覧 */
  masterItems: readonly MaintenanceScheduleMasterItem[]
  /** 対象車両の整備記録（順序は問わない） */
  maintenanceLogs: readonly MaintenanceScheduleLogSummary[]
}

type MileagePlan = {
  basis: 'MILEAGE'
  remainingMileage: number
  progressRatio: number
}

type PeriodPlan = {
  basis: 'PERIOD'
  dueDate: Date
  remainingDays: number
  progressRatio: number
}

type Plan = MileagePlan | PeriodPlan

/** ソート用の進捗率を保持した算出結果の内部表現 */
type InternalForecast = MaintenanceScheduleForecast & {
  /** 算出不能（記録なし・推奨間隔未設定）の場合は null */
  progressRatio: number | null
}

/**
 * 日付にnヶ月を加算する。
 *
 * @remarks
 * サーバーの実行タイムゾーンに依存せず決定的な結果になるよう、
 * ローカルタイムではなくUTCのカレンダー月で計算する。
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}

/**
 * メンテナンス項目ごとの「点検の予定」を算出する純粋なサービス
 *
 * @remarks
 * Issue #575「2. 点検の予定」の仕様に基づく。ユーザーごとの交換サイクル設定は
 * 持たず、呼び出し側が渡すマスタ値（既定値）と直近の整備記録から算出する。
 *
 * 判定ロジック:
 * - 該当するメンテナンス項目の整備記録が1件もない場合は `NO_RECORD` とする
 *   （購入時ODO・購入日を起点にした推測は行わない）
 * - マスタに走行距離・期間いずれの推奨間隔も設定されていない場合は `NO_INTERVAL`
 * - 走行距離・期間の両方が設定されている項目は、進捗率（経過分 ÷ 推奨間隔）が
 *   大きい方（＝先に到来する方）を採用する
 * - 採用した基準の進捗率が1.0以上で `OVERDUE`、`UPCOMING_THRESHOLD_RATIO`
 *   （0.8）以上で `UPCOMING`、それ未満は `OK`
 */
export class MaintenanceScheduleCalculationService {
  /**
   * 各メンテナンス項目の点検予定を算出し、残りが少ない順（＝到来が早い順）に
   * 並べて返す。
   *
   * @remarks
   * 残り距離（km）と残り日数（日）は単位が異なり単純比較できないため、
   * 全項目で共通の「進捗率」を内部的な尺度として算出順に用いる。
   * 記録なし・推奨間隔未設定の項目は進捗率を持たないため末尾に配置し、
   * その中では「記録なし（NO_RECORD）」を「推奨間隔未設定（NO_INTERVAL）」より
   * 前に並べる（マスタ内の元の順序は維持する）。
   */
  public calculate(
    input: MaintenanceScheduleCalculationInput
  ): MaintenanceScheduleForecast[] {
    const forecasts = input.masterItems.map((item) =>
      this.calculateForItem(item, input)
    )

    return this.sortByUrgency(forecasts)
  }

  private calculateForItem(
    item: MaintenanceScheduleMasterItem,
    input: MaintenanceScheduleCalculationInput
  ): InternalForecast {
    const base = {
      type: item.type,
      category: item.category,
      typeName: item.typeName,
      categoryName: item.categoryName,
    }

    const lastRecord = this.findLastRecord(item.type, input.maintenanceLogs)

    if (!lastRecord) {
      return {
        ...base,
        basis: null,
        remainingMileage: null,
        dueDate: null,
        remainingDays: null,
        lastRecord: null,
        status: 'NO_RECORD',
        progressRatio: null,
      }
    }

    if (
      item.recommendedMileageInterval === null &&
      item.recommendedPeriodMonths === null
    ) {
      return {
        ...base,
        basis: null,
        remainingMileage: null,
        dueDate: null,
        remainingDays: null,
        lastRecord,
        status: 'NO_INTERVAL',
        progressRatio: null,
      }
    }

    const mileagePlan =
      item.recommendedMileageInterval !== null
        ? this.calculateMileagePlan(
            lastRecord,
            item.recommendedMileageInterval,
            input.currentMileage
          )
        : null

    const periodPlan =
      item.recommendedPeriodMonths !== null
        ? this.calculatePeriodPlan(
            lastRecord,
            item.recommendedPeriodMonths,
            input.now
          )
        : null

    const adopted = this.pickPlan(mileagePlan, periodPlan)

    return {
      ...base,
      basis: adopted.basis,
      remainingMileage:
        adopted.basis === 'MILEAGE' ? adopted.remainingMileage : null,
      dueDate: adopted.basis === 'PERIOD' ? adopted.dueDate : null,
      remainingDays: adopted.basis === 'PERIOD' ? adopted.remainingDays : null,
      lastRecord,
      status: this.toStatus(adopted.progressRatio),
      progressRatio: adopted.progressRatio,
    }
  }

  /**
   * 対象メンテナンスタイプを含む整備記録のうち、最も新しいものを返す。
   * 実施日が同一の場合は走行距離が大きい方を優先する。
   */
  private findLastRecord(
    type: MaintenanceType,
    logs: readonly MaintenanceScheduleLogSummary[]
  ): MaintenanceScheduleLastRecord | null {
    let latest: MaintenanceScheduleLogSummary | null = null

    for (const log of logs) {
      if (!log.types.includes(type)) {
        continue
      }
      if (
        !latest ||
        log.performedAt.getTime() > latest.performedAt.getTime() ||
        (log.performedAt.getTime() === latest.performedAt.getTime() &&
          log.mileage > latest.mileage)
      ) {
        latest = log
      }
    }

    return latest
      ? { performedAt: latest.performedAt, mileage: latest.mileage }
      : null
  }

  private calculateMileagePlan(
    lastRecord: MaintenanceScheduleLastRecord,
    recommendedMileageInterval: number,
    currentMileage: number
  ): MileagePlan {
    const dueMileage = lastRecord.mileage + recommendedMileageInterval
    const remainingMileage = dueMileage - currentMileage
    const progressRatio =
      (currentMileage - lastRecord.mileage) / recommendedMileageInterval

    return { basis: 'MILEAGE', remainingMileage, progressRatio }
  }

  private calculatePeriodPlan(
    lastRecord: MaintenanceScheduleLastRecord,
    recommendedPeriodMonths: number,
    now: Date
  ): PeriodPlan {
    const dueDate = addMonths(lastRecord.performedAt, recommendedPeriodMonths)
    const remainingDays = Math.round(
      (dueDate.getTime() - now.getTime()) / MS_PER_DAY
    )

    const totalMs = dueDate.getTime() - lastRecord.performedAt.getTime()
    const elapsedMs = now.getTime() - lastRecord.performedAt.getTime()
    const progressRatio = totalMs > 0 ? elapsedMs / totalMs : 1

    return { basis: 'PERIOD', dueDate, remainingDays, progressRatio }
  }

  /**
   * 走行距離・期間の両方が算出できる場合は進捗率が高い方（＝先に到来する方）を、
   * 片方のみの場合はそれを採用する。
   */
  private pickPlan(
    mileagePlan: MileagePlan | null,
    periodPlan: PeriodPlan | null
  ): Plan {
    if (mileagePlan && periodPlan) {
      return mileagePlan.progressRatio >= periodPlan.progressRatio
        ? mileagePlan
        : periodPlan
    }
    if (mileagePlan) {
      return mileagePlan
    }
    if (periodPlan) {
      return periodPlan
    }

    // マスタに推奨間隔が1つも無い場合は呼び出し前（NO_INTERVAL判定）で
    // 除外されているため、ここには到達しない想定
    throw new Error(
      '走行距離・期間のいずれの推奨間隔も設定されていません（NO_INTERVALとして扱われるべき項目です）'
    )
  }

  private toStatus(progressRatio: number): MaintenanceScheduleStatus {
    if (progressRatio >= 1) {
      return 'OVERDUE'
    }
    if (progressRatio >= UPCOMING_THRESHOLD_RATIO) {
      return 'UPCOMING'
    }
    return 'OK'
  }

  private sortByUrgency(
    forecasts: readonly InternalForecast[]
  ): MaintenanceScheduleForecast[] {
    const withSchedule = forecasts.filter(
      (f): f is InternalForecast & { progressRatio: number } =>
        f.progressRatio !== null
    )
    const withoutSchedule = forecasts.filter((f) => f.progressRatio === null)

    // 進捗率が高いほど到来が早い（＝残りが少ない）ため降順に並べる
    // Array#sort は安定ソートなので、進捗率が同じ場合は元の順序を維持する
    const sortedWithSchedule = [...withSchedule].sort(
      (a, b) => b.progressRatio - a.progressRatio
    )

    // 記録なし（NO_RECORD）を推奨間隔未設定（NO_INTERVAL）より前に配置する
    const statusRank = (status: MaintenanceScheduleStatus): number =>
      status === 'NO_RECORD' ? 0 : 1
    const sortedWithoutSchedule = [...withoutSchedule].sort(
      (a, b) => statusRank(a.status) - statusRank(b.status)
    )

    return [...sortedWithSchedule, ...sortedWithoutSchedule].map(
      (forecast) => this.toPublicForecast(forecast)
    )
  }

  private toPublicForecast(
    forecast: InternalForecast
  ): MaintenanceScheduleForecast {
    return {
      type: forecast.type,
      category: forecast.category,
      typeName: forecast.typeName,
      categoryName: forecast.categoryName,
      basis: forecast.basis,
      remainingMileage: forecast.remainingMileage,
      dueDate: forecast.dueDate,
      remainingDays: forecast.remainingDays,
      lastRecord: forecast.lastRecord,
      status: forecast.status,
    }
  }
}
