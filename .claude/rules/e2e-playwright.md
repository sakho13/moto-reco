# Playwright E2E テスト規約

対象: `apps/e2e/`

## ディレクトリ構造

```
apps/e2e/
├── fixtures/          # カスタムフィクスチャ
├── helpers/           # API操作・データ生成などのユーティリティ
├── pages/             # Page Object Model (POM)
└── tests/
    └── {ドメイン}/    # 機能ドメインごとにサブディレクトリを切る
        └── *.spec.ts
```

### ドメインディレクトリの例

| ディレクトリ | 対象ページ・機能 |
|---|---|
| `tests/auth/` | ログイン・未認証リダイレクト |
| `tests/bike/` | バイク登録・マイバイク一覧 |
| `tests/profile/` | プロフィール・ログアウト |
| `tests/history/` | ヒストリー一覧 |

## Page Object Model (POM)

### 基本方針

- `pages/` 配下に配置し、ファイル名は `{ページ名}Page.ts`（キャメルケース）
- クラス名も `{ページ名}Page`
- `Locator` はコンストラクタで全て定義する
- ページ操作の手順は `async` メソッドとして切り出す

### ロケーター優先順位

1. `getByRole()` — アクセシビリティロールで取得（最優先）
2. `getByText()` — 表示テキストで取得
3. `locator('[data-testid="..."]')` — data-testid で取得
4. `locator('#id')` — フォーム要素の id で取得
5. CSSセレクター — 上記で取れない場合のみ

### strict モード注意点

`getByText()` や `getByRole()` が複数要素にマッチする場合は
`.first()` / `.nth()` で絞るか、スコープを親要素に限定する。

```typescript
// NG: 複数マッチでエラー
this.page.getByText(email)

// OK: 先頭1件に絞る
this.page.getByText(email).first()
```

### POM テンプレート

```typescript
import { type Locator, type Page } from '@playwright/test'

/**
 * ○○ページの Page Object Model
 *
 * @remarks
 * /app/xxx に対応。
 */
export class XxxPage {
  readonly page: Page
  readonly someLocator: Locator

  constructor(page: Page) {
    this.page = page
    this.someLocator = page.getByRole('button', { name: '○○' })
  }

  async goto(): Promise<void> {
    await this.page.goto('/app/xxx')
  }

  async doSomething(): Promise<void> {
    await this.someLocator.click()
    await this.page.waitForURL(/\/app\/yyy/, { timeout: 15_000 })
  }
}
```

## フィクスチャ

### authenticatedPage フィクスチャ

`fixtures/authenticatedPage.ts` からインポートして使う。
認証が必要なテストには必ずこのフィクスチャを使い、直接ログイン操作を書かない。

| フィクスチャ | 型 | 内容 |
|---|---|---|
| `authenticatedPage` | `Page` | ログイン済みの Page インスタンス |
| `testUserEmail` | `string` | テストユーザーのメールアドレス |
| `authToken` | `string` | Firebase ID トークン（API操作用） |

```typescript
import { expect, test } from '../../fixtures/authenticatedPage'

test('...', async ({ authenticatedPage, testUserEmail, authToken }) => {
  // authenticatedPage は既にホーム画面にログイン済み
})
```

### authToken の使いどころ

テスト本文で事前データをAPI経由で作成するとき（UIを通さない前提データ）に使う。

```typescript
import { registerTestBike } from '../../helpers/bikeHelper'

test('バイク登録後に一覧表示される', async ({ authenticatedPage, authToken }) => {
  await registerTestBike(authToken, { displacement: 400, totalMileage: 10000 })
  // ...
})
```

## ヘルパー

`helpers/` にAPIごとのセットアップ関数を配置する。

- `authHelper.ts` — Firebase Emulator のユーザー操作
- `bikeHelper.ts` — バイク登録API
- `createRandomEmail.ts` — テスト用メールアドレス生成

新しいリソースが必要になったら同じパターンでヘルパーを追加すること。

```typescript
// helpers/xxxHelper.ts のテンプレート
const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'

export async function registerTestXxx(token: string, ...): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/...`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`登録失敗: ${res.status} ${await res.text()}`)
  const json = (await res.json()) as { data: { id: string } }
  return json.data.id
}
```

## テスト設計の原則

### テスト分類

| 種別 | 内容 | 例 |
|---|---|---|
| 未認証リダイレクト | 保護ルートへ未認証アクセスでログインへ遷移する | `tests/auth/unauthenticated.spec.ts` |
| 表示テスト | ページが正常にレンダリングされ要素が見える | 各ページの `toBeVisible()` アサーション |
| フローテスト | ユーザー操作の一連の流れが完結する | 登録→リダイレクト、ログアウト後の遷移 |
| 状態テスト | データの有無で表示が切り替わる | 空状態メッセージ、登録後の一覧表示 |

### テストごとの独立性

- テストユーザーはフィクスチャが毎回新規作成するため、テスト間でデータは共有されない
- テスト内でのデータ作成は `authToken` ヘルパー経由のAPIか UIフローのどちらかに統一する
- `test.beforeAll` でのグローバルセットアップは原則使わない（DB競合を防ぐ）

### 並列実行の制約

`playwright.config.ts` の `fullyParallel: false` は意図的な設定（DBステートの共有）。
変更しないこと。CI では `workers: 1` で直列実行される。

## data-testid の付与ルール

アプリ側コンポーネントに `data-testid` を追加するときは以下の命名にする。

```
{コンポーネント名をケバブケース}-{要素の役割}
```

例:
- `data-testid="touring-section"`
- `data-testid="fuel-section"`
- `data-testid="history-section"`

セクション単位のルートコンテナにのみ付与する。
個々の子要素には `getByRole()` / `getByText()` で到達できるため原則不要。

## テスト実行コマンド

```bash
# 全テスト実行
pnpm exec playwright test

# 特定ファイルのみ
pnpm exec playwright test tests/profile/profile.spec.ts

# UIモードで実行（デバッグ用）
pnpm exec playwright test --ui

# 失敗時にHTMLレポートを確認
pnpm exec playwright show-report
```

## 新規テスト追加チェックリスト

- [ ] 対応するドメインのサブディレクトリに spec ファイルを作成した
- [ ] POM が存在しない場合は `pages/` に追加した
- [ ] 認証が必要なテストは `authenticatedPage` フィクスチャを使っている
- [ ] 事前データ作成は UI ではなく `authToken` + ヘルパーで行っている
- [ ] `getByText()` / `getByRole()` が複数マッチしないか確認した
- [ ] `pnpm exec playwright test` で全テストがパスすることを確認した
