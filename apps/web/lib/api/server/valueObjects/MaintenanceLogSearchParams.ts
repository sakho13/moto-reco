/**
 * メンテナンス履歴検索パラメータを表すバリューオブジェクト
 */
export class MaintenanceLogSearchParams {
  private readonly _page: number
  private readonly _pageSize: number
  private readonly _sortOrder: 'asc' | 'desc'
  private readonly _keyword?: string

  constructor(params: {
    page?: number
    pageSize?: number
    sortOrder?: 'asc' | 'desc'
    keyword?: string
  }) {
    this._page = params.page && params.page > 0 ? params.page : 1
    this._pageSize = this.validatePageSize(params.pageSize)
    this._sortOrder = params.sortOrder || 'desc'
    this._keyword = params.keyword
  }

  private validatePageSize(size?: number): number {
    if (!size || size < 1) return 20
    if (size > 100) return 100
    return size
  }

  get sortOrder(): 'asc' | 'desc' {
    return this._sortOrder
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
