import type { MyUserBikeId } from '@repo/shared-types'

/**
 * ユーザー購入グッズ検索パラメータを表すバリューオブジェクト
 */
export class UserGoodsSearchParams {
  private readonly _page: number
  private readonly _pageSize: number
  private readonly _myUserBikeId?: MyUserBikeId

  constructor(params: {
    page?: number
    pageSize?: number
    myUserBikeId?: MyUserBikeId
  }) {
    this._page = params.page && params.page > 0 ? params.page : 1
    this._pageSize = this.validatePageSize(params.pageSize)
    this._myUserBikeId = params.myUserBikeId
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

  get myUserBikeId(): MyUserBikeId | undefined {
    return this._myUserBikeId
  }
}
