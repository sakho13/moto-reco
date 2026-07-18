# moto-reco

バイクユーザー向けの記録・管理アプリケーション

## プロジェクト構成

このプロジェクトは [Turborepo](https://turborepo.com/) を使用したモノレポ構成です。

### Apps

- **`web`**: Next.js メインアプリケーション (http://localhost:3000)
  - LP（ランディングページ）、アプリ本体、API（Hono）、APIドキュメント（Scalar）、MCPサーバーを1つのアプリに統合
- **`admin`**: 管理画面 (http://localhost:3001)
  - Next.js + [Refine](https://refine.dev/) + Ant Design で構築
- **`e2e`**: Playwright E2Eテスト（アプリではないが `apps/` 配下で管理）

#### ポート番号

- Webアプリ: `WEB_PORT` (デフォルト: 3000)
- 管理画面: `ADMIN_PORT` (デフォルト: 3001)

### 開発ツール

- **Storybook**: UIコンポーネント開発環境 (http://localhost:6006)
  - `packages/ui`のコンポーネントをStorybookで開発・確認できます

### Packages

- **`@repo/ui`**: React コンポーネントライブラリ
- **`@repo/theme`**: テーマ管理パッケージ（カラー・フォントサイズ・曲線・シャドウ等のデザイントークン）
- **`@repo/database`**: Prisma データベースパッケージ
- **`@repo/shared-types`**: 共有型定義
- **`@repo/shared-utils`**: 共有ユーティリティ
- **`@repo/email`**: メール送信パッケージ（Resend連携、ウェルカムメール・通知メール等のテンプレート）
- **`@repo/firebase-auth-server`**: Firebase 認証サーバー
- **`@repo/eslint-config`**: ESLint 設定
- **`@repo/typescript-config`**: TypeScript 設定

すべてのパッケージとアプリは [TypeScript](https://www.typescriptlang.org/) で書かれています。

### インフラ (GCP)

- GCP Cloud Run（サービス: `motoreco-web`）を使用したコンテナデプロイを実施している
- データベースは Cloud SQL (PostgreSQL 17)、シークレットは Secret Manager で管理
- GitHub Actions から Workload Identity Federation（OIDC）でデプロイ
- リージョンは `asia-northeast1`（東京）
- 2026年3月にAWSからGCPへ移管済み（詳細は [`development/docs/02_design/infrastructure.md`](development/docs/02_design/infrastructure.md) を参照）

## 技術スタック

- **フロントエンド**: Next.js, React
- **管理画面**: Next.js, Refine, Ant Design
- **バックエンド**: Hono（Next.js の API Routes 上にマウント）
- **データベース**: PostgreSQL, Prisma
- **認証**: Firebase Authentication
- **ストレージ**: Firebase Storage（署名付きURLによる写真アップロード）
- **メール送信**: Resend
- **モノレポ**: Turborepo
- **パッケージマネージャー**: pnpm
- **開発ツール**: TypeScript, ESLint, Prettier, Vitest, Playwright

## 開発環境のセットアップ

### 必要要件

- Node.js >= 18
- pnpm 11.5.0
- Docker & Docker Compose

### 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成し、必要な環境変数を設定してください。

```bash
# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=dbname

# Firebase
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Webアプリケーション
NEXT_PUBLIC_WEB_URL=http://localhost:3000  # Webアプリの公開URL（本番環境では本番URLを設定）
NEXT_PUBLIC_APP_VERSION=dev  # アプリのバージョン表示用

# メール (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL="MotoReco <no-reply@example.com>"
```

写真アップロード機能をローカルで検証する場合の注意点は [`development/README.md`](development/README.md) の「写真アップロード機能（署名付きURL）のローカル検証」セクションを参照してください。

### インフラの起動

Docker Compose でローカル開発環境を起動します：

```bash
docker compose up -d
```

起動されるサービス：

- **PostgreSQL**: ポート 5432
- **Firebase Emulator**: ポート 4000 (UI), 9099 (Auth), 9199 (Storage)

### データベースのセットアップ

```bash
# スキーマをデータベースに適用
pnpm turbo db:deploy

# Prisma Client の型生成
pnpm turbo db:generate
```

### 依存関係のインストール

```bash
pnpm install
```

## 開発サーバーの起動

### すべてのアプリを起動

```bash
pnpm dev
```

### 特定のアプリを起動

```bash
# Webアプリのみ
pnpm dev:web

# 管理画面のみ
pnpm --filter admin dev
```

### Storybookの起動

```bash
# UIコンポーネント開発用
pnpm storybook
```

## データベース操作

```bash
# マイグレーションファイルの生成
pnpm turbo db:migrate

# Prisma Client の型生成
pnpm turbo db:generate

# スキーマをデータベースに適用
pnpm turbo db:deploy

# シードデータの投入
pnpm turbo db:seed

# Prisma Studio の起動 (packages/database 内で実行)
cd packages/database
pnpm prisma studio
```

## ビルド

```bash
# すべてのアプリとパッケージをビルド
pnpm build

# 特定のアプリをビルド
pnpm turbo build --filter=web
```

## テスト

```bash
# すべてのユニットテストを実行
pnpm test

# テストをウォッチモードで実行
pnpm turbo test:watch

# カバレッジレポート付きでテスト（apps/web）
pnpm --filter web test -- --coverage
```

### E2E テスト (Playwright)

E2E テストを実行するには、事前に開発サーバーを起動してください。

```bash
# 事前準備: インフラ起動 + 開発サーバー起動
docker compose up -d
pnpm dev:web

# E2E テストを実行（Chromium）
pnpm test:e2e

# UI モードで実行（ブラウザで操作確認しながらデバッグ）
pnpm --filter @apps/e2e test:e2e:ui

# テスト結果レポートを表示
pnpm --filter @apps/e2e test:e2e:report
```

## リント・フォーマット

```bash
# リント実行
pnpm lint

# コードフォーマット
pnpm format

# 型チェック
pnpm check-types
```

## 開発ドキュメント

詳細な開発ルールと設計ドキュメントは `development/` ディレクトリを参照してください：

- `development/docs/00_overview/`: 開発全体の概要
- `development/docs/01_domain/`: ドメイン設計
- `development/docs/02_design/`: システム設計
- `development/docs/03_development/`: 開発ルール
  - `coding.md`: コーディング規約
  - `git.md`: Git運用ルール

また、`docs/er-diagram.md` にDBスキーマのER図（Mermaid）があります。

## Turborepo について

このプロジェクトでは Turborepo を使用してモノレポを管理しています。

### 便利なコマンド

```bash
# 特定のパッケージのみビルド
pnpm turbo build --filter=web

# 特定のパッケージと依存関係をビルド
pnpm turbo build --filter=web...

# 並列実行の制御
pnpm turbo build --concurrency=2

# キャッシュをクリア
pnpm turbo clean
```

### 参考リンク

- [Turborepo Documentation](https://turborepo.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hono Documentation](https://hono.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
