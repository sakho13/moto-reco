import { TouringStatus } from '@repo/shared-types'

/**
 * ツーリング検索パラメータを表すバリューオブジェクト
 */
export class TouringSearchParams {
  private readonly _sortBy: 'startDate' | 'endDate'
  private readonly _sortOrder: 'asc' | 'desc'
  private readonly _status: TouringStatus | undefined

  constructor(params: {
    sortBy?: 'startDate' | 'endDate'
    sortOrder?: 'asc' | 'desc'
    status?: TouringStatus
  }) {
    this._sortBy = params.sortBy || 'startDate'
    this._sortOrder = params.sortOrder || 'desc'
    this._status = params.status
  }

  get sortBy(): 'startDate' | 'endDate' {
    return this._sortBy
  }

  get sortOrder(): 'asc' | 'desc' {
    return this._sortOrder
  }

  get status(): TouringStatus | undefined {
    return this._status
  }
}
