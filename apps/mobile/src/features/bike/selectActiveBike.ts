/** 愛車を選ぶのに必要な最小情報 */
export type SelectableBike = {
  myUserBikeId: string
}

/**
 * 表示する愛車を決める
 *
 * @remarks
 * 前回選んだ愛車がまだ登録されていればそれを、無ければ（削除された・
 * 別のアカウントでログインした等）一覧の先頭を選ぶ。愛車が無ければ null。
 */
export function selectActiveBike<T extends SelectableBike>(
  bikes: readonly T[],
  savedBikeId: string | null
): T | null {
  const saved = bikes.find((bike) => bike.myUserBikeId === savedBikeId)
  return saved ?? bikes[0] ?? null
}
