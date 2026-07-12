import type { GoodsCategory } from '@repo/shared-types'

/**
 * グッズ型番検索パラメータを表すバリューオブジェクト
 */
export class GoodsModelSearchParams {
  private readonly _manufacturerId?: string
  private readonly _category?: GoodsCategory
  private readonly _keyword?: string
  private readonly _page: number
  private readonly _pageSize: number

  constructor(params: {
    manufacturerId?: string
    category?: GoodsCategory
    keyword?: string
    page?: number
    pageSize?: number
  }) {
    this._manufacturerId = params.manufacturerId
    this._category = params.category
    this._keyword = params.keyword
    this._page = params.page && params.page > 0 ? params.page : 1
    this._pageSize = this.validatePageSize(params.pageSize)
  }

  private validatePageSize(size?: number): number {
    if (!size || size < 1) return 20
    if (size > 100) return 100
    return size
  }

  get manufacturerId(): string | undefined {
    return this._manufacturerId
  }

  get category(): GoodsCategory | undefined {
    return this._category
  }

  get keyword(): string | undefined {
    return this._keyword
  }

  get skip(): number {
    return (this._page - 1) * this._pageSize
  }

  get take(): number {
    return this._pageSize
  }
}
