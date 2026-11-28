/**
 * 2つのID配列が重複なしで同じ集合かどうかを判定する
 *
 * @remarks
 * 並び替えAPIで、リクエストされたIDが対象リソース配下のIDと過不足なく一致するかの検証に使う。
 * `requested` に重複が含まれる場合は `false` を返す。
 */
export const isSameIdSet = (
  requested: readonly string[],
  actual: readonly string[]
): boolean => {
  const requestedSet = new Set(requested)
  if (requestedSet.size !== requested.length) return false
  if (requestedSet.size !== actual.length) return false
  return actual.every((id) => requestedSet.has(id))
}
