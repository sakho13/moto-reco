import type { MaintenanceType } from '@repo/shared-types'

/**
 * メンテナンス履歴検索パラメータを表すバリューオブジェクト
 */
export class MaintenanceLogSearchParams {
  private readonly _page: number
  private readonly _pageSize: number
  private readonly _sortOrder: 'asc' | 'desc'
  private readonly _keyword?: string
  private readonly _maintenanceType?: MaintenanceType

  constructor(params: {
    page?: number
    pageSize?: number
    sortOrder?: 'asc' | 'desc'
    keyword?: string
    /** 指定したメンテナンス項目を含む履歴のみに絞り込む */
    maintenanceType?: MaintenanceType
  }) {
    this._page = params.page && params.page > 0 ? params.page : 1
    this._pageSize = this.validatePageSize(params.pageSize)
    this._sortOrder = params.sortOrder || 'desc'
    this._keyword = params.keyword
    this._maintenanceType = params.maintenanceType
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

  get maintenanceType(): MaintenanceType | undefined {
    return this._maintenanceType
  }

  get skip(): number {
    return (this._page - 1) * this._pageSize
  }

  get take(): number {
    return this._pageSize
  }
}
