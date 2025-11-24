# 開発用 README

## 開発ルール

本プロジェクトの開発仕様書は `development/docs/` 配下に記載されています。

- `docs/00_overview/`: 開発全体の概要
- `docs/01_domain/`: ドメイン設計
- `docs/02_design/`: システム設計
- `docs/03_development/`: 開発ルール
  - `coding.md`: コーディング規約
  - `git.md`: Git運用ルール

## コマンド

### 開発サーバーの起動

開発用サーバーの起動には以下のコマンドを使用します。

```bash
docker compose up -d

pnpm dev
```

### DB操作コマンド

```bash
# DBのマイグレーションを生成
pnpm turbo db:migrate

# DBの型生成
pnpm turbo db:generate

# DBへスキーマを適用
pnpm turbo db:deploy

# prisma studioの起動 (packages/database内で実行)
pnpm prisma studio
```
