# moto-reco

バイクユーザー向けの記録・管理アプリケーション

## プロジェクト構成

このプロジェクトは [Turborepo](https://turborepo.com/) を使用したモノレポ構成です。

### Apps

- **`web`**: Next.js フロントエンドアプリケーション (http://localhost:3000)
- **`api`**: Hono バックエンドAPI
- **`docs`**: Next.js ドキュメントサイト / OpenAPI仕様書 (http://localhost:3001)

### Packages

- **`@repo/ui`**: React コンポーネントライブラリ
- **`@packages/database`**: Prisma データベースパッケージ
- **`@packages/shared-types`**: 共有型定義
- **`@packages/shared-utils`**: 共有ユーティリティ
- **`@packages/firebase-auth-server`**: Firebase 認証サーバー
- **`@repo/eslint-config`**: ESLint 設定
- **`@repo/typescript-config`**: TypeScript 設定

すべてのパッケージとアプリは [TypeScript](https://www.typescriptlang.org/) で書かれています。

## 技術スタック

- **フロントエンド**: Next.js, React
- **バックエンド**: Hono, Fastify
- **データベース**: PostgreSQL, Prisma
- **認証**: Firebase Authentication
- **モノレポ**: Turborepo
- **パッケージマネージャー**: pnpm
- **開発ツール**: TypeScript, ESLint, Prettier, Vitest

## 開発環境のセットアップ

### 必要要件

- Node.js >= 18
- pnpm 9.15.4
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
USE_FIREBASE_EMULATOR=true
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

# AWS (LocalStack)
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### インフラの起動

Docker Compose でローカル開発環境を起動します：

```bash
docker compose up -d
```

起動されるサービス：
- **PostgreSQL**: ポート 5432
- **Firebase Emulator**: ポート 4000 (UI), 9099 (Auth)
- **LocalStack**: ポート 4566 (S3, SSM, SecretsManager等)

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

# APIサーバーのみ
pnpm dev:api

# ドキュメントサイトのみ
pnpm dev:docs
```

## データベース操作

```bash
# マイグレーションファイルの生成
pnpm turbo db:migrate

# Prisma Client の型生成
pnpm turbo db:generate

# スキーマをデータベースに適用
pnpm turbo db:deploy

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
pnpm turbo build --filter=api
```

## テスト

```bash
# すべてのテストを実行
pnpm test

# テストをウォッチモードで実行
pnpm turbo test:watch

# カバレッジレポート付きでテスト
pnpm turbo test:coverage
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
