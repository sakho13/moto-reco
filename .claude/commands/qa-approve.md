# テストケース承認・master昇格

あなたはQAオーケストレータです。
`.claude/qa/artifacts/` の草案CSVをレビュー確認後、ドメイン別に `.claude/qa/master/` へ追記します。

**引数:**
- 引数なし — 最新の `*-cases.csv` ファイルを自動選択
- `{artifacts-csv-path}` — CSVファイルを明示指定

---

## master/ の役割

- ドメイン横断でテストケースが蓄積される**正本台帳**
- 「このプロジェクトで何をテストしているか」を一覧できる状態を維持
- Issueクローズ後も残り、回帰トラック（`/qa-plan --regression`）の参照元となる
- `master/{domain}.csv` はカンマ区切りCSV（`csv-format.md` と同仕様）

---

## 実行手順

### ステップ1: 対象CSVの確認

```bash
# 引数なしの場合、最新の草案CSVを取得
ls -t .claude/qa/artifacts/*-cases.csv | head -1 | cat
```

ファイルの内容をユーザーに提示し、**承認を確認してから** master/ への昇格を行う。

> 「以下のCSVを master/ に追記します。問題ありませんか？」

### ステップ2: ドメイン別に分類

CSVを読み込み、`domain` 列の値でテストケースをグループ化する。

例:
- domain=`user` → `master/user.csv`
- domain=`plan` → `master/plan.csv`
- domain=`bike` → `master/bike.csv`
- domain=`fuel` → `master/fuel.csv`
- domain=`touring` → `master/touring.csv`
- domain=`maintenance` → `master/maintenance.csv`
- domain=`auth` → `master/auth.csv`
- domain=`notification` → `master/notification.csv`
- domain=`follow` → `master/follow.csv`

### ステップ3: 重複チェック

各 `master/{domain}.csv` が存在する場合：

```bash
cat .claude/qa/master/{domain}.csv
```

既存の `test_id` と追記しようとするテストIDを比較し、**重複するIDはスキップ**する。

### ステップ4: master/ への追記

**新規ファイルの場合:** ヘッダー行 + データ行を書き込む

```
requirement_id,test_id,priority,test_level,domain,persona,quality_characteristic,test_type,precondition,steps,expected_result,is_negative,automation,test_file_path,implementation_status,test_basis,notes,created_at
```

**既存ファイルへの追記:** ヘッダー行なしでデータ行のみ追記する

### ステップ5: artifacts/ の保持

artifacts/ のファイルは**削除しない**。スナップショットとして残す。

### ステップ6: 完了報告

```
master/ への昇格が完了しました。

## 結果
- 対象CSVファイル: {path}
- 追記ドメイン:
  - master/user.csv: +{n}件（スキップ: {m}件）
  - master/plan.csv: +{n}件（スキップ: {m}件）
  - ...
- 合計追記件数: {total}件

## master/ 現在の状況
| ドメイン | 件数 |
|---------|------|
| user    | {n}件 |
| plan    | {n}件 |
| ...     | ...  |
| 合計    | {total}件 |

artifacts/ のスナップショットはそのまま保持されています。
```

---

## 注意事項

- すべてのコミュニケーションは**日本語**で行う
- **ユーザーの承認なしに master/ への書き込みは行わない**（ステップ1で必ず確認）
- `implementation_status` が `スキップ` のテストケースも master/ に含める（除外しない）
- 重複テストIDのスキップ件数は必ず報告する
- master/ の更新後は `git status` で変更ファイルを確認してユーザーに示す
