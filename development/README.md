# 開発用 README

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
