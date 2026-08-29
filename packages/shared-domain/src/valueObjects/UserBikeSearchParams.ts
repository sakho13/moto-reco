/**
 * ユーザーバイク一覧検索パラメータを表すバリューオブジェクト
 */
export class UserBikeSearchParams {
  private readonly _sortBy: 'createdAt' | 'updatedAt'
  private readonly _sortOrder: 'asc' | 'desc'

  constructor(params: {
    sortBy?: 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
  }) {
    this._sortBy = params.sortBy || 'updatedAt'
    this._sortOrder = params.sortOrder || 'desc'
  }

  get sortBy(): 'createdAt' | 'updatedAt' {
    return this._sortBy
  }

  get sortOrder(): 'asc' | 'desc' {
    return this._sortOrder
  }
}
