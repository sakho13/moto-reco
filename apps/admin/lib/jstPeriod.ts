const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export const STATS_PERIOD_DAYS = [7, 30, 90] as const
export type StatsPeriodDays = (typeof STATS_PERIOD_DAYS)[number]

/**
 * ダッシュボードの集計期間
 *
 * @remarks
 * `start` は期間初日の0時（JST）、`end` は最終日の翌日0時（JST）で、`end` は含まない。
 * `previousStart` は直前の同じ日数の期間の初日0時（JST）。
 */
export type JstPeriod = {
  days: StatsPeriodDays
  /** 期間初日（JST、YYYY-MM-DD） */
  from: string
  /** 期間最終日（JST、YYYY-MM-DD） */
  to: string
  start: Date
  end: Date
  previousStart: Date
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** JSTでの日付を YYYY-MM-DD で返す */
export function toJstDateString(date: Date): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10)
}

/** YYYY-MM-DD（JST）の0時を返す。存在しない日付は null */
export function parseJstDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const time = Date.parse(`${value}T00:00:00+09:00`)
  if (Number.isNaN(time)) return null
  const date = new Date(time)
  return toJstDateString(date) === value ? date : null
}

export function parseStatsPeriodDays(
  value: string | null
): StatsPeriodDays | null {
  const days = Number(value)
  return STATS_PERIOD_DAYS.find((d) => d === days) ?? null
}

/** `now` を含む日を最終日とする、直近 `days` 日間（JST）を返す */
export function getJstPeriod(now: Date, days: StatsPeriodDays): JstPeriod {
  const to = toJstDateString(now)
  const end = addDays(parseJstDate(to)!, 1)
  const start = addDays(end, -days)
  return {
    days,
    from: toJstDateString(start),
    to,
    start,
    end,
    previousStart: addDays(start, -days),
  }
}

/** `start` から `days` 日分の日付（JST、YYYY-MM-DD）を古い順に返す */
export function listJstDates(start: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) =>
    toJstDateString(addDays(start, i))
  )
}

/**
 * 検索条件の `from` / `to`（JSTの日付）を日時の範囲に変換する
 *
 * @remarks
 * `to` の日は終日を含む。不正な日付は条件なしとして扱う。
 */
export function toJstDateRange(
  from: string | null,
  to: string | null
): { gte?: Date; lt?: Date } | undefined {
  const start = from ? parseJstDate(from) : null
  const end = to ? parseJstDate(to) : null
  if (!start && !end) return undefined
  return {
    ...(start ? { gte: start } : {}),
    ...(end ? { lt: addDays(end, 1) } : {}),
  }
}
