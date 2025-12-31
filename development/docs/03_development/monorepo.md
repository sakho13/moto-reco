# Monorepo 参照規約

## パッケージ構成

本プロジェクトは pnpm workspace を使用した monorepo 構成を採用しています。

### アプリケーション (apps/)

| パッケージ名 | 説明 | ディレクトリ |
|---|---|---|
| `@apps/web` | Next.js メインアプリケーション | `apps/web/` |
| `@apps/docs` | Next.js ドキュメントサイト | `apps/docs/` |

### パッケージ (packages/)

| パッケージ名 | 説明 | ディレクトリ |
|---|---|---|
| `@repo/typescript-config` | TypeScript 共有設定 | `packages/typescript-config/` |
| `@repo/eslint-config` | ESLint 共有設定 | `packages/eslint-config/` |
| `@repo/database` | Prisma ORM 統合パッケージ | `packages/database/` |
| `@repo/firebase-auth-server` | Firebase Admin SDK ラッパー | `packages/firebase-auth-server/` |
| `@repo/shared-types` | ドメインモデルとスキーマの共有型定義 | `packages/shared-types/` |
| `@repo/shared-utils` | ユーティリティ関数の共有パッケージ | `packages/shared-utils/` |
| `@repo/ui` | React UI コンポーネントライブラリ | `packages/ui/` |
| `@repo/theme` | テーマ管理パッケージ | `packages/theme/` |

### 依存関係図

```
@apps/web
  ├── @repo/database
  ├── @repo/firebase-auth-server
  ├── @repo/shared-types
  ├── @repo/shared-utils
  ├── @repo/ui
  │   └── @repo/theme
  ├── @repo/eslint-config (devDependencies)
  └── @repo/typescript-config (devDependencies)

@apps/docs
  ├── @repo/ui
  │   └── @repo/theme
  ├── @repo/eslint-config (devDependencies)
  └── @repo/typescript-config (devDependencies)
```

## 参照方法

### パッケージスコープ

すべてのパッケージは `@repo/*` スコープを使用します。

### package.json での依存関係宣言

```json
{
  "dependencies": {
    "@repo/database": "workspace:*",
    "@repo/shared-types": "workspace:*",
    "@repo/ui": "workspace:*"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*"
  }
}
```

**重要**: workspace 内のパッケージは必ず `workspace:*` プロトコルで参照すること。

## Import 推奨パターン

### UIコンポーネント: 詳細 import 推奨

UIコンポーネントは Tree-shaking を最適化するため、**詳細 import を推奨**します。

```typescript
// ✅ 推奨: 詳細 import
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { FormField } from '@repo/ui/formField'

// ✅ 推奨: Context も詳細 import
import { ThemeProvider, useTheme } from '@repo/ui/context/ThemeContext'

// ❌ 非推奨: メインエントリー経由 (バンドルサイズが大きくなる)
import { Button, Input, FormField } from '@repo/ui'
```

**利点**:
- Tree-shaking の最適化
- 依存関係の明確化
- ビルドサイズの削減

### その他パッケージ: メインエントリー経由

UI コンポーネント以外のパッケージは、メインエントリー経由の import を使用します。

```typescript
// ✅ database
import { prisma } from '@repo/database'

// ✅ shared-types
import type { BikeListItem, ApiResponseUserProfile } from '@repo/shared-types'

// ✅ shared-utils
import { generateRandNumberStr } from '@repo/shared-utils'

// ✅ firebase-auth-server
import { firebaseAdminAuthClient } from '@repo/firebase-auth-server'

// ✅ theme
import { themes, themeNames } from '@repo/theme'
```

## 新規パッケージの追加方法

### 1. ディレクトリとファイルの作成

```bash
mkdir -p packages/new-package/src
cd packages/new-package
```

### 2. package.json テンプレート

```json
{
  "name": "@repo/new-package",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch",
    "check-types": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "typescript": "catalog:"
  }
}
```

### 3. tsconfig.json テンプレート

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. exports フィールドの設定方法

#### 単一エントリーポイントの場合

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

#### 複数エントリーポイント (UI コンポーネントなど)

```json
{
  "exports": {
    "./*": "./src/*.tsx",
    ".": "./src/index.tsx"
  }
}
```

この設定により、以下の両方のパターンが可能になります:

```typescript
import { Button } from '@repo/ui/button'  // 詳細 import (推奨)
import { Button } from '@repo/ui'         // メインエントリー経由
```

### 5. 依存関係の追加

新規パッケージを追加したら、使用する側の `package.json` に依存関係を追加します:

```json
{
  "dependencies": {
    "@repo/new-package": "workspace:*"
  }
}
```

その後、pnpm install を実行:

```bash
pnpm install
```

## トラブルシューティング

### 型が解決されない

**症状**: IDE で型が解決されず、エラーが表示される

**対処法**:

1. pnpm install を実行
2. TypeScript Language Server を再起動 (VSCode: `Cmd+Shift+P` → "Restart TS Server")
3. 該当パッケージの `tsconfig.json` を確認

### import が解決されない

**症状**: import 文でモジュールが見つからないエラー

**対処法**:

1. package.json の `exports` フィールドを確認
2. 正しいパスで import しているか確認

```typescript
// ❌ 間違い
import { Button } from '@repo/ui/src/button'

// ✅ 正しい
import { Button } from '@repo/ui/button'
```

3. pnpm install を実行して依存関係を再構築

### ビルドエラー

**症状**: `pnpm build` でエラーが発生

**対処法**:

1. 型チェックを実行: `pnpm check-types`
2. エラーメッセージを確認し、型の不整合を修正
3. Next.js の場合、`next.config.js` の `transpilePackages` に追加:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/shared-types', '@repo/database'],
}

export default nextConfig
```

### workspace パッケージが見つからない

**症状**: `workspace:*` で指定したパッケージが見つからない

**対処法**:

1. `pnpm-workspace.yaml` に packages が含まれているか確認:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

2. パッケージの `name` フィールドが正しいか確認
3. pnpm install を実行

## ベストプラクティス

### 1. 循環参照の回避

パッケージ間の循環参照は避けてください。依存関係は一方向に保つこと。

```
❌ 避けるべき循環参照
@repo/ui → @repo/theme → @repo/ui

✅ 正しい依存関係
@repo/ui → @repo/theme
```

### 2. パッケージの責務を明確に

各パッケージは単一の責務を持つべきです:

- `@repo/database`: データベースアクセスのみ
- `@repo/shared-types`: 型定義のみ
- `@repo/ui`: UIコンポーネントのみ

### 3. 型定義の共有

型定義は `@repo/shared-types` に集約し、複数のパッケージで再利用します。

### 4. 設定の共有

TypeScript、ESLint などの設定は、それぞれの専用パッケージに集約します:

- `@repo/typescript-config`
- `@repo/eslint-config`

## 参考資料

- [pnpm workspace](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Next.js Transpile Packages](https://nextjs.org/docs/app/api-reference/next-config-js/transpilePackages)
