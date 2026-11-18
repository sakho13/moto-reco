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

## Git Worktree開発

複数のworktreeで並行開発する場合、Dockerコンテナのポート競合を避けるため、各worktreeで異なるポートを設定する必要があります。

### ポート設定

`.env.local`で以下の環境変数を変更することで、各worktreeで異なるポートを使用できます。

```bash
# === Docker Container Ports ===
DATABASE_PORT=5432                    # PostgreSQL
DOCKER_FIREBASE_UI_PORT=4000          # Firebase Emulator UI
DOCKER_FIREBASE_AUTH_PORT=9099        # Firebase Auth Emulator
DOCKER_FIREBASE_STORAGE_PORT=9199     # Firebase Storage Emulator
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
| DOCKER_FIREBASE_STORAGE_PORT     | 9199           | 9299       | 9399       |
| DOCKER_LOCALSTACK_PORT           | 4566           | 4666       | 4766       |
| DOCKER_LOCALSTACK_SERVICES_START | 4510           | 4610       | 4710       |
| DOCKER_LOCALSTACK_SERVICES_END   | 4559           | 4659       | 4759       |

**注意**: ポートを変更した場合、`DATABASE_URL`や`FIREBASE_AUTH_EMULATOR_HOST`なども更新してください。  
**注意**: Worktree A では `DOCKER_FIREBASE_AUTH_PORT=9199` と `DOCKER_FIREBASE_STORAGE_PORT`（デフォルト 9199）が競合します。Worktree A で Storage を使う場合は `DOCKER_FIREBASE_STORAGE_PORT=9299` を明示的に設定してください。

## モバイルアプリ（Expo）の開発

`apps/mobile` は Expo（React Native）のアプリです。API は Web アプリ（`apps/web`）のものを使うため、先に Web アプリを起動しておきます。

```bash
docker compose up -d
pnpm dev:web

# 別のターミナルで Expo の開発サーバーを起動する
pnpm dev:mobile
```

表示された QR コードを Expo Go で読み取るか、`i`（iOS シミュレーター）/ `a`（Android エミュレーター）で起動します。

### 環境変数

Expo は `EXPO_PUBLIC_` で始まる環境変数だけをアプリに埋め込みます。`.env.local` に以下を設定してください（値の例はルートの `README.md` を参照）。

| 環境変数 | 内容 |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | API のURL（例: `http://localhost:3000`） |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase の設定（Web の `NEXT_PUBLIC_FIREBASE_*` と同じ値） |
| `EXPO_PUBLIC_USE_FIREBASE_EMULATOR` | Firebase Auth Emulator を使うなら `true` |
| `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` | Auth Emulator のURL（例: `http://localhost:9099`） |

アプリに埋め込まれるため、秘密にすべき値（サーバー用の鍵など）は設定しないでください。

### 実機から接続する場合

実機のアプリから見た `localhost` は端末自身なので、`EXPO_PUBLIC_API_BASE_URL` と `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` には開発PCのLAN IPを指定します（例: `http://192.168.0.10:3000`）。
WSL2 の場合は、後述の「LAN端末（iPhone等）からのFirebase Emulator接続」と同じ手順で、Web アプリのポート（3000）と Auth Emulator のポートを転送してください。

### 実装上の注意

- 画面は `@repo/ui`（DOM・Tailwind 前提）を使わず、`@repo/theme` のデザイントークンで Web と見た目を揃える
- API の呼び出しは `@repo/api-client`、入力チェックと Firebase のエラーメッセージは `@repo/shared-utils`、給油記入票の計算は `@repo/shared-domain/fuelLogSheet` を Web と共有する
- Firebase Auth の React Native 用ビルドを使うため、`metro.config.js` で Firebase のパッケージだけ `exports` を使わずに解決している
- ログイン状態の保存先には `expo-sqlite/kv-store` を使う。`@react-native-async-storage/async-storage` を入れると、pnpm が Web 側の Firebase の peer 依存としても解決し、Web に React Native が入り込むため使わない
- E2E テスト（Playwright）は Web 専用で、モバイルは対象外

## 写真アップロード機能（署名付きURL）のローカル検証

写真アップロード機能は署名付きURL（V4署名）を使用しており、Firebase Storage Emulator経由でも**構文的に有効なRSA秘密鍵**が`FIREBASE_PRIVATE_KEY`に設定されている必要があります（署名計算自体はローカルで完結し、実際のGCPとは通信しないため、ダミー鍵で問題ありません）。

`.env.local`にはこの用途のダミー鍵が設定済みです。万一プレースホルダ（`YOUR_PRIVATE_KEY`）に戻ってしまった場合は、以下で再生成してください。

```bash
openssl genrsa 2048 | awk '{printf "%s\\n", $0}'
```

出力を`FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`の形式で`.env.local`に設定してください。

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
