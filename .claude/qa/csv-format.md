# テストケースCSV列仕様

テストケースCSVは**18列**、**カンマ区切り**、**改行は`<br>`**で統一。
ヘッダー行を含む。不明な値は空欄のままにする（でっち上げ禁止）。
セル値にカンマが含まれる場合は**ダブルクォートで囲む**（標準CSV形式）。

---

## 列定義

| # | 列名（英語キー） | 日本語ラベル | 値の例・ルール |
|---|---|---|---|
| 1 | `requirement_id` | 要件ID | GitHub Issue番号（数字のみ）`123`、なければ `-` |
| 2 | `test_id` | テストID | `T-{DOMAIN}-{3桁連番}` 例: `T-USER-001` |
| 3 | `priority` | 優先度 | `P0`（クリティカル）/ `P1`（高）/ `P2`（中）/ `P3`（低） |
| 4 | `test_level` | テストレベル | `unit` / `api` / `e2e` |
| 5 | `domain` | ドメイン | `user` / `bike` / `fuel` / `touring` / `maintenance` / `plan` / `auth` / `notification` |
| 6 | `persona` | ペルソナ | `P1` 〜 `P7` |
| 7 | `quality_characteristic` | 品質特性 | `機能適切性` / `セキュリティ` / `信頼性` / `性能効率性` / `使用性` / `互換性`（ISO/IEC 25010） |
| 8 | `test_type` | テストタイプ | `正常系` / `異常系` / `境界値` / `回帰` |
| 9 | `precondition` | 前提条件 | 複数条件はコロンで区切る。カンマを含む場合はセル全体をダブルクォートで囲む。例: `"role=USER, plan=FREE, bikes=2件登録済み"` |
| 10 | `steps` | テスト手順 | 複数ステップは `<br>` で区切る。例: `1. POST /api/v1/bikes<br>2. body: {name: "CB400SF"}` |
| 11 | `expected_result` | 期待結果 | HTTPステータス・DBテーブル.カラム名を含める。カンマを含む場合はダブルクォートで囲む。例: `"HTTP 201, TUserMyBike レコード1件追加"` |
| 12 | `is_negative` | 異常系フラグ | `true`（異常系・境界値オーバー） / `false`（正常系） |
| 13 | `automation` | 自動化方法 | `Vitest` / `Playwright` / `手動` |
| 14 | `test_file_path` | テストファイルパス候補 | 既存ファイルがあればパス。例: `apps/web/__tests__/api/v1/user.test.ts`、未定なら空欄 |
| 15 | `implementation_status` | 実装ステータス | `未実装`（初期値）/ `実装済み` / `スキップ` |
| 16 | `test_basis` | Test Basis | 仕様の一次情報ソース。例: `packages/shared-types/src/domain/user.ts:UserPlan` |
| 17 | `notes` | 備考 | 補足・技術的注意点。不要なら空欄 |
| 18 | `created_at` | 作成日 | `YYYY-MM-DD` 形式 |

---

## ドメインコード一覧

| domain値 | 対象機能 |
|---------|---------|
| `user` | ユーザープロフィール・アカウント設定 |
| `plan` | FREE/PREMIUMプラン管理・履歴 |
| `auth` | Firebase認証・ログイン・ログアウト |
| `bike` | バイク車種マスター・マイバイク管理 |
| `fuel` | 給油履歴・燃費計算 |
| `touring` | ツーリング履歴・スポット記録 |
| `maintenance` | メンテナンス履歴・推奨時期 |
| `notification` | ユーザー通知・アナウンスメント |
| `follow` | フォロー・フォロワー管理 |

---

## テストIDの採番ルール

```
T-{DOMAIN_UPPER}-{3桁連番}

例:
  T-USER-001  ユーザー関連テスト1件目
  T-PLAN-001  プラン関連テスト1件目
  T-BIKE-003  バイク関連テスト3件目
```

`DOMAIN_UPPER` は `domain` 列の値を大文字化したもの。

---

## CSVヘッダー行

```
requirement_id,test_id,priority,test_level,domain,persona,quality_characteristic,test_type,precondition,steps,expected_result,is_negative,automation,test_file_path,implementation_status,test_basis,notes,created_at
```

---

## 記入例

```csv
requirement_id,test_id,priority,test_level,domain,persona,quality_characteristic,test_type,precondition,steps,expected_result,is_negative,automation,test_file_path,implementation_status,test_basis,notes,created_at
123,T-PLAN-001,P0,api,plan,P5,機能適切性,境界値,"role=USER, plan=FREE, bikes=2件登録済み","1. POST /api/v1/bikes<br>2. body: {name: ""CB750"" vehicleType: ""LARGE""}","HTTP 422 または 400",true,Vitest,apps/web/__tests__/api/v1/userBike.test.ts,未実装,apps/web/lib/api/server/valueObjects/AccountLimitsValue.ts,FREEプランはバイク2台が上限,2026-06-24
```

---

## 品質特性（ISO/IEC 25010）の選択基準

| 特性 | 使う場面 |
|-----|---------|
| `機能適切性` | 仕様通りに動くか |
| `セキュリティ` | 認可・認証・入力検証・情報漏洩 |
| `信頼性` | エラーハンドリング・データ整合性 |
| `性能効率性` | レスポンスタイム・大量データ処理 |
| `使用性` | UX・エラーメッセージのわかりやすさ |
| `互換性` | 型定義とAPIの一致・スキーマ整合 |
