import { TouringStatus } from '@repo/shared-types'

/**
 * ツーリング検索パラメータを表すバリューオブジェクト
 */
export class TouringSearchParams {
  private readonly _sortBy: 'startDate' | 'endDate'
  private readonly _sortOrder: 'asc' | 'desc'
  private readonly _status: TouringStatus | undefined
  private readonly _keyword: string | undefined

  constructor(params: {
    sortBy?: 'startDate' | 'endDate'
    sortOrder?: 'asc' | 'desc'
    status?: TouringStatus
    keyword?: string
  }) {
    this._sortBy = params.sortBy || 'startDate'
    this._sortOrder = params.sortOrder || 'desc'
    this._status = params.status
    this._keyword = params.keyword
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

  get keyword(): string | undefined {
    return this._keyword
  }
}
