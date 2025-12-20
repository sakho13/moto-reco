# CLAUDE

## 基本

- 日本語でコミュニケーションをとること

## 開発

開発ルールは `development/README.md` を参照すること。

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

### pnpmスクリプト

コミット前に以下のコマンドを実行すること。

```bash
# リントの実行
pnpm lint

# フォーマットの実行
pnpm format

# ビルドの実行 NODE_ENVはNext.jsエラー対策のために指定
NODE_ENV=production pnpm build
```

以下のコマンドは任意で実行すること。

```bash
# テストの実行
pnpm test
```
