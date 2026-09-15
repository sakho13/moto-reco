/**
 * バイクの表示名・付帯情報の組み立てユーティリティ
 *
 * @remarks
 * バイク名の組み立てロジックはホーム・ヘッダー・マイバイクなど複数箇所で
 * 必要になるため、ここに集約する。
 */

type BikeNameFields = {
  nickname: string | null
  manufacturerName: string | null
  modelName: string | null
}

type BikeMetaFields = {
  displacement: number
  totalMileage: number
}

/**
 * バイクの表示名を組み立てる
 *
 * @remarks
 * ニックネームがあればそれを優先し、無ければ「メーカー名 モデル名」を使う。
 * どちらも無い場合は「不明なバイク」とする。
 */
export function getBikeDisplayName(bike: BikeNameFields): string {
  return (
    bike.nickname ||
    `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()
  )
}

/**
 * バイクの付帯情報（排気量・総走行距離）を組み立てる
 */
export function getBikeDisplayMeta(bike: BikeMetaFields): string {
  return `${bike.displacement}cc ・ ${bike.totalMileage.toLocaleString()}km`
}
