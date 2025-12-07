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

## Git Worktree開発

複数のworktreeで並行開発する場合、Dockerコンテナのポート競合を避けるため、各worktreeで異なるポートを設定する必要があります。

### ポート設定

`.env.local`で以下の環境変数を変更することで、各worktreeで異なるポートを使用できます。

```bash
# === Docker Container Ports ===
DATABASE_PORT=5432                    # PostgreSQL
DOCKER_FIREBASE_UI_PORT=4000          # Firebase Emulator UI
DOCKER_FIREBASE_AUTH_PORT=9099        # Firebase Auth Emulator
DOCKER_LOCALSTACK_PORT=4566           # LocalStack Gateway
DOCKER_LOCALSTACK_SERVICES_START=4510 # LocalStack Services Range Start
DOCKER_LOCALSTACK_SERVICES_END=4559   # LocalStack Services Range End
```

### Worktree別のポート設定例

| 環境変数                         | メインブランチ | Worktree A | Worktree B |
| -------------------------------- | -------------- | ---------- | ---------- |
| DATABASE_PORT                    | 5432           | 5433       | 5434       |
| DOCKER_FIREBASE_UI_PORT          | 4000           | 4100       | 4200       |
| DOCKER_FIREBASE_AUTH_PORT        | 9099           | 9199       | 9299       |
| DOCKER_LOCALSTACK_PORT           | 4566           | 4666       | 4766       |
| DOCKER_LOCALSTACK_SERVICES_START | 4510           | 4610       | 4710       |
| DOCKER_LOCALSTACK_SERVICES_END   | 4559           | 4659       | 4759       |

**注意**: ポートを変更した場合、`DATABASE_URL`や`FIREBASE_AUTH_EMULATOR_HOST`なども更新してください。
