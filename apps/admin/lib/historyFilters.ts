import type { CrudFilter, CrudFilters } from '@refinedev/core'
import dayjs, { type Dayjs } from 'dayjs'

export type DateRangeValue = [Dayjs | null, Dayjs | null] | null

/**
 * 検索フォームの値を一覧APIのフィルタに変換する
 *
 * @remarks
 * 空の項目も `value: undefined` で返す。refine は前回のフィルタと合成し、
 * 値が `undefined` の項目を取り除くため、これでクリアした条件が残らない。
 */
export function buildHistoryFilters(
  values: Record<string, string | undefined>,
  range: DateRangeValue | undefined
): CrudFilters {
  const [from, to] = range ?? [null, null]
  const fields: Record<string, string | undefined> = {
    ...values,
    from: from?.format('YYYY-MM-DD'),
    to: to?.format('YYYY-MM-DD'),
  }
  return Object.entries(fields).map(
    ([field, value]): CrudFilter => ({
      field,
      operator: 'eq',
      value: value || undefined,
    })
  )
}

/**
 * 一覧のフィルタの `from` / `to` から期間欄の値を作る
 *
 * @remarks
 * refine は URL のフィルタを同じ名前のフォーム項目にしか戻さないため、
 * `range` 欄の初期値はこの関数で作る。
 */
export function getDateRangeValue(
  filters: CrudFilters
): DateRangeValue | undefined {
  const findDate = (field: string) => {
    const filter = filters.find((f) => 'field' in f && f.field === field)
    return typeof filter?.value === 'string' && filter.value
      ? dayjs(filter.value)
      : null
  }
  const from = findDate('from')
  const to = findDate('to')
  return from || to ? [from, to] : undefined
}
