/**
 * バイク検索パラメータを表すバリューオブジェクト
 */
export class BikeSearchParams {
  private readonly _manufacturerOperator?: 'eq' | 'ne' | 'in'
  private readonly _manufacturerIds?: string[]
  private readonly _modelName?: string
  private readonly _displacementMin?: number
  private readonly _displacementMax?: number
  private readonly _modelYearMin?: number
  private readonly _modelYearMax?: number
  private readonly _page: number
  private readonly _pageSize: number
  private readonly _sortBy?: 'modelName' | 'displacement' | 'modelYear'
  private readonly _sortOrder: 'asc' | 'desc'

  constructor(params: {
    manufacturerOperator?: 'eq' | 'ne' | 'in'
    manufacturerIds?: string[]
    modelName?: string
    displacementMin?: number
    displacementMax?: number
    modelYearMin?: number
    modelYearMax?: number
    page?: number
    pageSize?: number
    sortBy?: 'modelName' | 'displacement' | 'modelYear'
    sortOrder?: 'asc' | 'desc'
  }) {
    this._manufacturerOperator = params.manufacturerOperator
    this._manufacturerIds = params.manufacturerIds
    this._modelName = params.modelName
    this._displacementMin = params.displacementMin
    this._displacementMax = params.displacementMax
    this._modelYearMin = params.modelYearMin
    this._modelYearMax = params.modelYearMax
    this._page = params.page && params.page > 0 ? params.page : 1
    this._pageSize = this.validatePageSize(params.pageSize)
    this._sortBy = params.sortBy
    this._sortOrder = params.sortOrder || 'asc'
  }

  private validatePageSize(size?: number): number {
    if (!size || size < 1) return 20
    if (size > 100) return 100
    return size
  }

  get manufacturerOperator(): 'eq' | 'ne' | 'in' | undefined {
    return this._manufacturerOperator
  }

  get manufacturerIds(): string[] | undefined {
    return this._manufacturerIds
  }

  get modelName(): string | undefined {
    return this._modelName
  }

  get displacementMin(): number | undefined {
    return this._displacementMin
  }

  get displacementMax(): number | undefined {
    return this._displacementMax
  }

  get modelYearMin(): number | undefined {
    return this._modelYearMin
  }

  get modelYearMax(): number | undefined {
    return this._modelYearMax
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

  get sortBy(): 'modelName' | 'displacement' | 'modelYear' | undefined {
    return this._sortBy
  }

  get sortOrder(): 'asc' | 'desc' {
    return this._sortOrder
  }
}
