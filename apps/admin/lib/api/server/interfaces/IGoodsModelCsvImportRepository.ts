import type { GoodsCategoryValue } from '@/lib/goodsModelCsv'

export type CsvImportCompany = {
  id: string
  name: string
  /** グッズメーカー（GOODS_MANUFACTURER）カテゴリを持つか */
  isGoodsManufacturer: boolean
}

export type GoodsModelKey = {
  goodsManufacturerId: string
  modelNumber: string
}

export type GoodsModelCreateInput = GoodsModelKey & {
  name: string
  category: GoodsCategoryValue
  imageUrl: string | null
  description: string | null
  releaseDate: Date | null
  amazonAsin: string | null
  rakutenItemId: string | null
  officialUrl: string | null
  isActive: boolean
}

export interface IGoodsModelCsvImportRepository {
  /**
   * 会社名の一覧から会社を取得する
   */
  findCompaniesByNames(names: string[]): Promise<CsvImportCompany[]>

  /**
   * 指定したメーカー×型番の組み合わせのうち、既に登録済みのものを取得する
   */
  findExistingGoodsModelKeys(keys: GoodsModelKey[]): Promise<GoodsModelKey[]>

  /**
   * グッズ型番を一括登録する
   *
   * @returns 登録件数
   */
  createGoodsModels(inputs: GoodsModelCreateInput[]): Promise<number>
}
