/**
 * ASIN・楽天商品IDから購入リンクURLを算出するバリューオブジェクト。
 */
export class GoodsPurchaseLinksValue {
  private constructor(
    private readonly _amazonAsin: string | null,
    private readonly _rakutenItemId: string | null
  ) {}

  static from(
    amazonAsin: string | null,
    rakutenItemId: string | null
  ): GoodsPurchaseLinksValue {
    return new GoodsPurchaseLinksValue(amazonAsin, rakutenItemId)
  }

  get amazonUrl(): string | null {
    return this._amazonAsin
      ? `https://www.amazon.co.jp/dp/${this._amazonAsin}`
      : null
  }

  get rakutenUrl(): string | null {
    return this._rakutenItemId
      ? `https://item.rakuten.co.jp/${this._rakutenItemId}`
      : null
  }
}
