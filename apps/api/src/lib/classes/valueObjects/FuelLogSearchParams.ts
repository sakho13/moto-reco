/**
 * 燃料ログ検索パラメータを表すバリューオブジェクト
 */
export class FuelLogSearchParams {
  private readonly _page: number
  private readonly _pageSize: number
  private readonly _sortBy: 'refueledAt' | 'mileage'
  private readonly _sortOrder: 'asc' | 'desc'

  constructor(params: {
    page?: number
    pageSize?: number
    sortBy?: 'refueledAt' | 'mileage'
    sortOrder?: 'asc' | 'desc'
  }) {
    this._page = params.page && params.page > 0 ? params.page : 1
    this._pageSize = this.validatePageSize(params.pageSize)
    this._sortBy = params.sortBy || 'refueledAt'
    this._sortOrder = params.sortOrder || 'desc'
  }

  private validatePageSize(size?: number): number {
    if (!size || size < 1) return 20
    if (size > 100) return 100
    return size
  }

  get page(): number {
    return this._page
  }

  get pageSize(): number {
    return this._pageSize
  }

  get skip(): number {
    return (this._page - 1) * this._pageSize
  }

  get take(): number {
    return this._pageSize
  }

  get sortBy(): 'refueledAt' | 'mileage' {
    return this._sortBy
  }

  get sortOrder(): 'asc' | 'desc' {
    return this._sortOrder
  }
}
