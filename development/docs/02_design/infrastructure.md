# GCPインフラ構成

motorecoの本番インフラ（GCP）の構成リファレンスです。

> AWSからGCPへ移管済み（2026年3月）。

---

## プロジェクト情報

| 項目 | 値 |
|------|-----|
| GCPプロジェクトID | `${GCP_PROJECT_ID}` |
| 主要リージョン | `asia-northeast1`（東京） |

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions (.github/workflows/)                             │
└────────────────────┬────────────────────────────────────────────┘
                     │ OIDC認証
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Workload Identity Federation                                    │
│  Pool: github / Provider: github-provider                        │
│  Service Account: github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐      ┌───────────────────────────────────┐
│  Artifact Registry   │      │  Cloud Run                         │
│  motoreco-web        │ ───> │  Service: motoreco-web             │
│  motoreco-migration  │      │  Job: motoreco-migration           │
└──────────────────────┘      └──────────────────┬────────────────┘
                                                  │ Cloud SQL Proxy（コンテナ内）
                                                  ▼
                               ┌──────────────────────────────────┐
                               │  Cloud SQL                        │
                               │  motoreco-db                      │
                               │  PostgreSQL 17 / db-g1-small      │
                               └──────────────────────────────────┘

                               ┌──────────────────────────────────┐
                               │  Secret Manager                   │
                               │  database-url                     │
                               │  firebase-private-key             │
                               │  firebase-project-id              │
                               │  firebase-client-email            │
                               └──────────────────────────────────┘
```

---

## GCPリソース一覧

### Cloud Run Service

| 項目 | 値 |
|------|-----|
| サービス名 | `motoreco-web` |
| リージョン | `asia-northeast1` |
| CPU | 1 vCPU |
| メモリ | 512 MiB |
| 最小インスタンス | 0 |
| 最大インスタンス | 10 |
| タイムアウト | 300秒 |
| 同時実行 | 80 |
| 認証 | 未認証許可（public） |

**環境変数（平文）**

| 変数名 | 値 |
|--------|-----|
| `NODE_ENV` | `production` |
| `WEB_PORT` | `3000` |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | `false` |
| `NEXT_PUBLIC_FIREBASE_*` | GitHub Secretsからビルド時注入 |

**シークレット（Secret Manager経由）**

| 変数名 | Secret名 |
|--------|----------|
| `DATABASE_URL` | `database-url` |
| `FIREBASE_PRIVATE_KEY` | `firebase-private-key` |
| `FIREBASE_PROJECT_ID` | `firebase-project-id` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-client-email` |

---

### Cloud Run Jobs

| 項目 | 値 |
|------|-----|
| ジョブ名 | `motoreco-migration` |
| リージョン | `asia-northeast1` |
| CPU | 1 vCPU |
| メモリ | 512 MiB |
| タイムアウト | 10分 |
| リトライ | 0回 |
| 実行内容 | `pnpm prisma migrate deploy` |

---

### Cloud SQL

| 項目 | 値 |
|------|-----|
| インスタンス名 | `motoreco-db` |
| エンジン | PostgreSQL 17 |
| マシンタイプ | db-g1-small（共有vCPU、1.7GB RAM） |
| ストレージ | SSD 20GB（自動拡張、上限100GB） |
| ゾーン | シングルゾーン（asia-northeast1-a） |
| 接続 | パブリックIP / SSL必須 |
| バックアップ | 自動（7日間保持）/ PITR有効 |
| バックアップ時間帯 | 17:00-18:00 UTC（JST 02:00-03:00） |

アプリケーションからは **Cloud SQL Proxy**（コンテナ内に同梱）経由で `localhost:5432` に接続する。

---

### Artifact Registry

| リポジトリ名 | 用途 |
|------------|------|
| `motoreco-web` | Webアプリ（Next.js）イメージ |
| `motoreco-migration` | DBマイグレーション用イメージ |

リージョン: `asia-northeast1`
イメージパス: `asia-northeast1-docker.pkg.dev/${GCP_PROJECT_ID}/<リポジトリ名>/<イメージ名>:<タグ>`

---

### Secret Manager

| シークレット名 | 内容 |
|--------------|------|
| `database-url` | PostgreSQL接続文字列（Cloud SQLパブリックIP経由） |
| `firebase-private-key` | Firebase Admin SDK秘密鍵（JSON） |
| `firebase-project-id` | Firebase Project ID |
| `firebase-client-email` | Firebase Client Email |

---

### Workload Identity Federation

GitHub ActionsからGCPへのキーレス認証に使用。

| 項目 | 値 |
|------|-----|
| Pool | `github` |
| Provider | `github-provider` |
| Issuer | `https://token.actions.githubusercontent.com` |
| Service Account | `github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com` |

**Service Accountの権限**

| ロール | 用途 |
|--------|------|
| `roles/run.admin` | Cloud Runデプロイ |
| `roles/artifactregistry.writer` | イメージプッシュ |
| `roles/secretmanager.secretAccessor` | シークレット取得 |
| `roles/iam.serviceAccountUser` | Service Account実行 |
| `roles/logging.viewer` | ログ閲覧 |

---

## GitHub Secrets

GitHubリポジトリの Settings > Secrets and variables > Actions で設定。

| Secret名 | 説明 |
|---------|------|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com` |
| `PROD_FIREBASE_API_KEY` | Firebase API Key |
| `PROD_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `PROD_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `PROD_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `PROD_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `PROD_FIREBASE_APP_ID` | Firebase App ID |
| `PROD_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID |

---

## デプロイフロー（本番）

本番環境は **Blue-Greenデプロイ** で運用する。トラフィック切り替えを手動で行うことで、デプロイ後の動作確認を経てから本番反映できる。

```
1. タグ作成
   git tag gcp-release/x.y.z
   git push origin gcp-release/x.y.z
         │
         ▼
2. [自動] deploy-gcp-production.yml 実行
   - Dockerイメージをビルド
   - Artifact Registryにプッシュ
   - Cloud Run Jobイメージを更新
   - Cloud Runに新リビジョンをデプロイ（トラフィック0%）
         │
         ▼
3. [手動] run-migration.yml 実行
   - Cloud Run JobsでPrismaマイグレーション実行
         │
         ▼
4. [手動] switch-traffic.yml 実行
   - リビジョン名を指定してトラフィック100%切り替え
   - CONFIRM確認あり（誤操作防止）
```

---

## GitHub Actionsワークフロー

| ファイル | トリガー | 内容 |
|---------|---------|------|
| `deploy-gcp-production.yml` | `gcp-release/*` タグ作成 | イメージビルド＆新リビジョンデプロイ（no-traffic） |
| `run-migration.yml` | 手動（workflow_dispatch） | Cloud Run JobsでPrismaマイグレーション実行 |
| `switch-traffic.yml` | 手動（workflow_dispatch） | 指定リビジョンへトラフィック100%切り替え |
| `every-pr-check.yml` | PRオープン/更新 | lint・build・test（PostgreSQL / LocalStack / Firebase Emulator使用） |
| `purge-quit-users.yml` | 週次cron（毎週月曜04:00 JST）＋手動（workflow_dispatch） | 猶予期間(30日)を超過した退会ユーザーの完全削除バッチAPI（`POST /api/internal/purge-quit-users`）をHTTPで呼び出す |

### 完全削除バッチ（purge-quit-users.yml）

退会ユーザーの完全物理削除（Firebase Authアカウント・DB関連データ・Storage実ファイル）は、GCPのCloud Schedulerではなく **GitHub Actionsのschedule** から実行する（GCPの新規課金リソースを増やさないための方針）。

内部バッチAPI・システムAPIキー管理は、一般ユーザー向けAPIを持つ`motoreco-web`ではなく、管理者専用の`motoreco-admin`（Next.js Route Handler）に実装する。呼び出し先URLはGitHubリポジトリ（またはproduction environment）のVariables `ADMIN_API_BASE_URL` で管理する。

```
GitHub Actions (schedule: cron)
  │ HTTP POST (Authorization: Bearer <システムAPIキー>)
  ▼
Cloud Run (motoreco-admin)
  POST /api/internal/purge-quit-users
  │ MSystemApiKeyのハッシュ照合で認証（IP制限ミドルウェアの対象外）
  ▼
PurgeUserService
  1. Firebase Authアカウント削除（失敗時はDB削除に進まず、次回バッチで再試行できるようにする）
  2. Storage実ファイル削除
  3. TUserPlanHistory（changedBy）の明示削除（Restrict FK対応）
  4. MUser削除（Cascadeで関連データ削除）
```

- 認証はDB管理の`MSystemApiKey`テーブルによるハッシュ照合（環境変数ではない）。発行・失効は管理者専用API/UI（`motoreco-admin`の`/system-api-keys`）で行う。
- ワークフロー内で参照する平文キーはGitHub Secretsの`INTERNAL_PURGE_SECRET`に登録する（登録作業はリポジトリ管理者が別途実施する）。
- 対象ユーザーが1件失敗してもバッチ全体は継続する（ユーザー単位でtry/catch）。

---

## ローカル開発環境との対応

| 本番（GCP） | ローカル開発 |
|------------|------------|
| Cloud SQL（PostgreSQL 17） | Docker Compose で起動するPostgreSQL 17 |
| Secret Manager | `.env.local` に直接記載 |
| Firebase Authentication | Firebase Emulator |
| Cloud Storage / S3相当 | LocalStack |

---

## 運用コマンド集

### ログ確認

```bash
# Cloud Runログ（直近）
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=motoreco-web" \
  --limit=50 \
  --project=${GCP_PROJECT_ID}

# エラーのみ
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 \
  --project=${GCP_PROJECT_ID}

# マイグレーションジョブのログ
gcloud logging read \
  "resource.type=cloud_run_job AND resource.labels.job_name=motoreco-migration" \
  --limit=20 \
  --project=${GCP_PROJECT_ID}
```

### マイグレーション手動実行

```bash
gcloud run jobs execute motoreco-migration \
  --region=asia-northeast1 \
  --wait
```

### リビジョン・トラフィック確認

```bash
# 現在のリビジョン一覧
gcloud run revisions list \
  --service=motoreco-web \
  --region=asia-northeast1

# トラフィック状況確認
gcloud run services describe motoreco-web \
  --region=asia-northeast1 \
  --format='value(status.traffic)'

# 手動でトラフィック切り替え（switch-traffic.ymlが使えない場合）
gcloud run services update-traffic motoreco-web \
  --to-revisions=<REVISION_NAME>=100 \
  --region=asia-northeast1
```

### Cloud SQL接続（メンテナンス時）

```bash
gcloud sql connect motoreco-db \
  --user=motoreco_admin \
  --project=${GCP_PROJECT_ID}
```

---

## トラブルシューティング

### Workload Identity Federation認証エラー（GitHub Actions）

```bash
# Service Accountのバインディング確認
gcloud iam service-accounts get-iam-policy \
  github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com

# Workload Identity Pool確認
gcloud iam workload-identity-pools describe "github" \
  --location="global" \
  --project=${GCP_PROJECT_ID}
```

### Cloud Runデプロイエラー

```bash
# サービスログ確認
gcloud run services logs read motoreco-web \
  --region=asia-northeast1 \
  --limit=50

# サービス詳細（ステータス・環境変数確認）
gcloud run services describe motoreco-web \
  --region=asia-northeast1
```

### Cloud SQL接続エラー

```bash
# インスタンス状態確認
gcloud sql instances describe motoreco-db \
  --project=${GCP_PROJECT_ID}

# Authorized Networks確認
gcloud sql instances describe motoreco-db \
  --format='value(settings.ipConfiguration.authorizedNetworks)'
```
