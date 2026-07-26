import { type Locator, type Page } from '@playwright/test'

/**
 * グッズカタログ検索ページの Page Object Model
 *
 * @remarks
 * /app/goods/catalog に対応。
 * メーカー・カテゴリはネイティブ `<select>` で `getByRole('combobox')` が
 * 複数マッチしてしまうため、id指定で区別する。
 */
export class GoodsCatalogPage {
  readonly page: Page
  readonly section: Locator
  readonly manufacturerSelect: Locator
  readonly categorySelect: Locator
  readonly keywordInput: Locator
  readonly noResultMessage: Locator
  readonly registerButton: Locator

  constructor(page: Page) {
    this.page = page
    this.section = page.getByTestId('goods-catalog-section')
    this.manufacturerSelect = page.locator('#manufacturerId')
    this.categorySelect = page.locator('#category')
    this.keywordInput = page.getByPlaceholder('型番・商品名で検索')
    this.noResultMessage =
      page.getByText('該当するグッズが見つかりませんでした')
    this.registerButton = this.section.getByRole('button', {
      name: 'これを登録する',
    })
  }

  /** グッズカタログページへ遷移する */
  async goto(): Promise<void> {
    await this.page.goto('/app/goods/catalog')
  }

  /** メーカーで絞り込む */
  async filterByManufacturer(manufacturerId: string): Promise<void> {
    await this.manufacturerSelect.selectOption(manufacturerId)
  }

  /** カテゴリで絞り込む */
  async filterByCategory(category: string): Promise<void> {
    await this.categorySelect.selectOption(category)
  }

  /** キーワードを入力する（デバウンス待ちは呼び出し側で行う） */
  async searchByKeyword(keyword: string): Promise<void> {
    await this.keywordInput.fill(keyword)
  }

  /** 商品名・型番（部分一致可）でカタログアイテムを取得する */
  catalogItem(pattern: string | RegExp): Locator {
    return this.section.getByText(pattern)
  }
}
