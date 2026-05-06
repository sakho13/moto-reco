# 開発用 README

## 開発ルール

本プロジェクトの開発仕様書は `development/docs/` 配下に記載されています。

- `docs/00_overview/`: 開発全体の概要
- `docs/01_domain/`: ドメイン設計
- `docs/02_design/`: システム設計
- `docs/03_development/`: 開発ルール
  - `monorepo.md`: monorepo参照規約

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

### Storybook

UIコンポーネントの開発・確認にはStorybookを使用します。

```bash
# Storybookの起動
pnpm storybook
```

起動後、http://localhost:6006 でアクセスできます。

詳細な使い方は [`packages/ui/README.md`](../packages/ui/README.md#storybookでのコンポーネント開発) を参照してください。

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

## LAN端末（iPhone等）からのFirebase Emulator接続

iPhoneなど同一LAN上のデバイスでアプリを確認する際、Firebase Auth Emulatorへの接続に追加設定が必要です。

### なぜ設定が必要か

Firebase Auth SDK はサーバーではなく**ブラウザ（iPhoneのブラウザ）から直接** Emulator へ接続します。
そのため `localhost:9099` ではiPhone側からは到達できず、WindowsホストのLAN IPを通じたポートフォワーディングが必要です。

### ⚠️ 重要: Dockerポートとの競合

`netsh interface portproxy` でポートをフォワーディングすると、**Dockerが同じポートをバインドできなくなります**。
LAN接続を設定する場合は、Dockerコンテナ側のFirebase Auth ポートを別のポートに変更してください。

例: `.env.local` で `DOCKER_FIREBASE_AUTH_PORT=9199` に変更してからコンテナを再起動する。

### 設定手順

**PowerShell（管理者権限）で実行：**

```powershell
# 1. WSL2のIPアドレスを確認
wsl hostname -I
# → 例: 172.x.x.x が表示される。このIPを以下の <WSL2_IP> に使用する

# 2. Windowsファイアウォールでポートを許可（<PORT> は DOCKER_FIREBASE_AUTH_PORT の値）
netsh advfirewall firewall add rule name="Firebase Emulator <PORT>" dir=in action=allow protocol=TCP localport=<PORT>

# 3. ポートフォワーディングを設定
netsh interface portproxy add v4tov4 listenport=<PORT> listenaddress=0.0.0.0 connectport=<PORT> connectaddress=<WSL2_IP>
```

設定後、iPhoneのブラウザから `http://<WindowsのLAN IP>:<PORT>` へアクセスし、Firebase Emulator UIが表示されることを確認してください。

> **注意**: WSL2を再起動するとWSL2のIPが変わります。再起動後はportproxyルールを更新する必要があります。

### 設定の確認

```powershell
netsh interface portproxy show all
```

### 解除手順

LAN接続が不要になったら必ず解除してください（解除しないとDockerがポートを使用できません）。

**PowerShell（管理者権限）で実行：**

```powershell
# portproxyルールを削除
netsh interface portproxy delete v4tov4 listenport=<PORT> listenaddress=0.0.0.0

# ファイアウォールルールを削除（任意）
netsh advfirewall firewall delete rule name="Firebase Emulator <PORT>"
```

解除後、Dockerコンテナを再起動してポートを復元してください。

```bash
docker compose down firebase_emulator
docker compose up -d firebase_emulator
```
