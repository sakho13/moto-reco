# moto-reco インフラ (AWS CDK)

`infra/` では AWS CDK v2 を用いた IaC を管理します。開発環境で CDK コマンドを実行できるよう、必要な設定とディレクトリ構成を用意しています。

## 前提

- Node.js 18 以上
- pnpm 9 以上
- AWS 資格情報（`~/.aws/credentials` または環境変数）を設定済み
- 初回は依存関係をインストールしてください。

```bash
pnpm install
```

## ディレクトリ構成

```
infra/
├─ bin/            # CDK アプリのエントリポイント
├─ lib/            # スタック定義
├─ cdk.json        # CDK 設定
├─ package.json    # CDK 用パッケージ設定
└─ tsconfig.json   # TypeScript 設定
```

## 環境変数

CDK 実行時に使用する AWS アカウントやリージョンは、環境変数または `~/.aws/config` で指定してください。

```bash
export CDK_DEFAULT_ACCOUNT=<AWS_ACCOUNT_ID>
export CDK_DEFAULT_REGION=ap-northeast-1
```

## よく使うコマンド

```bash
# 合成（CloudFormation テンプレート出力）
pnpm --filter infra synth

# 変更差分の確認
pnpm --filter infra diff

# デプロイ
pnpm --filter infra deploy
```

※ `pnpm --filter infra <command>` を使うとモノレポのルートから実行できます。

## スタックについて

現在はベースとなる `MotoRecoStack` を作成しています。AWS リソースの追加は `lib/moto-reco-stack.ts` に実装してください。
