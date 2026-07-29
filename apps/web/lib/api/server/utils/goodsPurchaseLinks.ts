/**
 * AmazonのASINから商品ページURLを生成する
 *
 * @param asin - Amazon商品識別子（ASIN）
 * @returns 商品ページURL
 */
export function buildAmazonUrl(asin: string): string {
  return `https://www.amazon.co.jp/dp/${asin}`
}

/**
 * 楽天の商品IDから商品ページURLを生成する
 *
 * @param itemId - 楽天商品ID
 * @returns 商品ページURL
 */
export function buildRakutenUrl(itemId: string): string {
  return `https://item.rakuten.co.jp/${itemId}`
}
