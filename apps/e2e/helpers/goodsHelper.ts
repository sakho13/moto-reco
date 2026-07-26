import { BASE_URL } from './env'

export type TestGoodsModel = {
  goodsModelId: string
  goodsManufacturerId: string
  manufacturerName: string
  modelNumber: string
  name: string
  category: string
}

export type TestGoodsManufacturer = {
  goodsManufacturerId: string
  name: string
  nameEn: string | null
}

/**
 * API経由でグッズ型番マスタを検索し、1件取得する（シードデータ前提）
 *
 * @throws 該当する型番が見つからない場合（シードデータ未投入等）
 */
export async function findTestGoodsModel(
  token: string,
  options: {
    keyword?: string
    manufacturerId?: string
    category?: string
  } = {}
): Promise<TestGoodsModel> {
  const params = new URLSearchParams({ 'per-size': '1' })
  if (options.keyword) params.set('keyword', options.keyword)
  if (options.manufacturerId)
    params.set('manufacturerId', options.manufacturerId)
  if (options.category) params.set('category', options.category)

  const res = await fetch(
    `${BASE_URL}/api/v1/goods/models?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`グッズ型番検索失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { models: TestGoodsModel[] } }
  if (json.data.models.length === 0) {
    throw new Error(
      'テスト用グッズ型番が見つかりません。シードデータを確認してください。'
    )
  }
  return json.data.models[0]!
}

/**
 * API経由でグッズメーカー一覧を取得する
 */
export async function listTestGoodsManufacturers(
  token: string
): Promise<TestGoodsManufacturer[]> {
  const res = await fetch(`${BASE_URL}/api/v1/goods/manufacturers`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    throw new Error(
      `グッズメーカー一覧取得失敗: ${res.status} ${await res.text()}`
    )
  }
  const json = (await res.json()) as {
    data: { manufacturers: TestGoodsManufacturer[] }
  }
  return json.data.manufacturers
}

/**
 * API経由でユーザー購入グッズ(TUserGoods)を登録し、userGoodsId を返す
 */
export async function registerTestUserGoods(
  token: string,
  options: {
    goodsModelId?: string
    userMyBikeId?: string | null
    purchasedAt?: string | null
    price?: number | null
    memo?: string | null
  } = {}
): Promise<string> {
  const goodsModelId =
    options.goodsModelId ?? (await findTestGoodsModel(token)).goodsModelId

  const res = await fetch(`${BASE_URL}/api/v1/user-goods`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      goodsModelId,
      userMyBikeId: options.userMyBikeId ?? null,
      purchasedAt: options.purchasedAt ?? null,
      price: options.price ?? null,
      memo: options.memo ?? null,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    throw new Error(`購入グッズ登録失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { userGoodsId: string } }
  return json.data.userGoodsId
}
