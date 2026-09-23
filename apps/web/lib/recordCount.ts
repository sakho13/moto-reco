/**
 * 件数をラベル用の文字列に変換する
 *
 * @remarks
 * 件数取得中・取得失敗時は「—」を出す。0件確定時のみ「0件」と表示する。
 * 愛車ページの記録リンク（`BikeRecordLinks`）とPCサイドバーの記録リンク
 * （`SidebarBikeRecordLinks`）が同じ表記になるよう共有する。
 */
export function formatRecordCount(count: number | undefined): string {
  if (count === undefined) return '—'
  return `${count.toLocaleString()}件`
}
