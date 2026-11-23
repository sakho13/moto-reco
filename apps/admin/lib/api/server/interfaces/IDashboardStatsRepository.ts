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

  /**
   * MCPツールの呼び出し回数を日ごとに数える
   */
  countDailyMcpToolCalls(range: DateTimeRange): Promise<DailyCount[]>

  /**
   * 外部アプリからのMCP連携（OAuthトークンの発行）の数を日ごとに数える
   */
  countDailyMcpConnections(range: DateTimeRange): Promise<DailyCount[]>

  /**
   * `now` 時点で有効なMCP連携の数と、連携しているユーザーの数を数える
   *
   * @remarks
   * 失効しておらず、リフレッシュトークン（無ければアクセストークン）の期限内の連携を有効とする。
   */
  countActiveMcpConnections(
    now: Date
  ): Promise<{ users: number; connections: number }>

  /**
   * `now` 時点で有効なMCP連携の数を、連携元アプリごとに多い順で数える
   */
  countActiveMcpConnectionsByClient(
    now: Date
  ): Promise<{ clientName: string; connections: number }[]>

  /**
   * MCPツールの呼び出し回数と失敗回数を、ツールごとに多い順で数える
   */
  countMcpToolCallsByTool(
    range: DateTimeRange
  ): Promise<{ toolName: string; calls: number; errors: number }[]>

  /**
   * MCPツールを呼び出したユーザーの数を、範囲全体で重複を除いて数える
   */
  countMcpToolCallUsers(range: DateTimeRange): Promise<number>
}
