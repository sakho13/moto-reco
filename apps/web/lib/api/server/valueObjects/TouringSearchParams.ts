/**
 * ツーリング検索パラメータを表すバリューオブジェクト
 */
export class TouringSearchParams {
  private readonly _sortBy: 'startDate' | 'endDate'
  private readonly _sortOrder: 'asc' | 'desc'

  constructor(params: {
    sortBy?: 'startDate' | 'endDate'
    sortOrder?: 'asc' | 'desc'
  }) {
    this._sortBy = params.sortBy || 'startDate'
    this._sortOrder = params.sortOrder || 'desc'
  }

  get sortBy(): 'startDate' | 'endDate' {
    return this._sortBy
  }

  get sortOrder(): 'asc' | 'desc' {
    return this._sortOrder
  }
}
