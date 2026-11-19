/** 集計対象の日時の範囲（`start` を含み `end` を含まない） */
export type DateTimeRange = { start: Date; end: Date }

/** JSTの日付（YYYY-MM-DD）ごとの件数。件数が0の日は含まない */
export type DailyCount = { date: string; count: number }

export interface IDashboardStatsRepository {
  /**
   * 登録されたユーザー数を日ごとに数える
   */
  countDailyNewUsers(range: DateTimeRange): Promise<DailyCount[]>

  /**
   * 登録された給油記録の数を日ごとに数える
   */
  countDailyFuelLogs(range: DateTimeRange): Promise<DailyCount[]>

  /**
   * 登録されたツーリングの数を日ごとに数える
   */
  countDailyTourings(range: DateTimeRange): Promise<DailyCount[]>

  /**
   * 登録されたメンテナンス記録の数を日ごとに数える
   */
  countDailyMaintenances(range: DateTimeRange): Promise<DailyCount[]>

  /**
   * 給油・ツーリング・メンテナンスのいずれかを登録したユーザーの数を、日ごとに重複を除いて数える
   */
  countDailyActiveUsers(range: DateTimeRange): Promise<DailyCount[]>

  /**
   * 給油・ツーリング・メンテナンスのいずれかを登録したユーザーの数を、範囲全体で重複を除いて数える
   */
  countActiveUsers(range: DateTimeRange): Promise<number>
}
