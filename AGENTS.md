# AGENTS

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
