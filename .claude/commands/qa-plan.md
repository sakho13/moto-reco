# QA計画立案（オーケストレータ）

あなたはQAオーケストレータです。
指定された機能・IssueのQA計画骨格を作成し、`.claude/qa/artifacts/` に保存します。

**引数:**
- `#123` — GitHub Issue起点（新機能トラック）
- `--regression` — `git diff main..HEAD` 起点（回帰トラック）
- `{自由テキスト}` — 機能説明から計画

---

## 「やらないこと」（重要）

- テストケースの詳細は生成しない（それは `/qa-cases` の役割）
- 仕様が不明な箇所は空欄のままにする（でっち上げ禁止）
- テストコードを書かない
- テストの合否判定は行わない

---

## 実行手順

### ステップ1: 引数の解析

引数のパターンを判定する：

```
- "#数字" → Issue番号（新機能トラック）
- "--regression" → git diff起点（回帰トラック）
- それ以外 → テキスト説明起点
```

### ステップ2: 仕様の取得

**新機能トラック（Issue番号）:**
```bash
gh issue view {番号} --json title,body,labels,comments | cat
```

**回帰トラック（--regression）:**
```bash
git diff main..HEAD --name-only | cat
git diff main..HEAD --stat | cat
```

**テキスト説明起点:** そのままステップ3へ。

### ステップ3: コードベース調査

Explore エージェントを使って以下を調査する：

1. **関連ソースファイルの特定**
   - 機能名でgrepして関連ファイルを列挙
   - 変更/追加されたファイルの依存関係

2. **既存テスト状況の確認**
   ```bash
   find apps/web/__tests__ -name "*.test.ts" | cat
   find apps/e2e/tests -name "*.spec.ts" | cat
   ```

3. **制限値の確認（AccountLimitsValue が関係する場合）**
   ```bash
   cat apps/web/lib/api/server/valueObjects/AccountLimitsValue.ts
   cat apps/web/lib/statics.ts
   ```

4. **型定義の確認**
   ```bash
   cat packages/shared-types/src/domain/user.ts
   ```

### ステップ4: QA計画骨格の作成

以下のMarkdownフォーマットで計画を作成する：

```markdown
# QA計画: {機能名}

## 基本情報
- 要件ID: #{Issue番号} または `-`
- 作成日: {YYYY-MM-DD}
- トラック: 新機能 / 回帰

## 対象機能サマリー
{何をテストするかを2〜3文で}

## 関連ファイル
### ソースファイル
- `path/to/file.ts` — {役割}

### 既存テストファイル
- `apps/web/__tests__/api/v1/xxx.test.ts` — {カバー範囲}
- `apps/e2e/tests/xxx/` — {カバー範囲}

## テストが必要なロール×プランの組み合わせ
| ロール | プラン | テストが必要か |
|-------|-------|------------|
| USER  | FREE  | ✓ |
| USER  | PREMIUM | ✓ |
| ADMIN | -     | ✓ |
| GUEST | -     | ✓ |

## ペルソナ別の重点観点ヒント
- **P1 新規ユーザー**: {この機能でP1が確認すべきこと}
- **P2 パワーユーザー**: {この機能でP2が確認すべきこと}
- **P3 攻撃者**: {この機能でP3が確認すべきこと}
- **P4 データ整合性**: {確認すべきテーブル・カラム}
- **P5 制限値番人**: {境界値となる制限値の一覧}
- **P6 回帰担当**: {影響を受ける可能性のある周辺機能}
- **P7 仕様懐疑**: {照合すべき型定義・スキーマのパス}

## スコープ外（今回テストしないこと）
- {除外理由とともに記載}

## 参照情報
- Prismaスキーマ: `packages/database/prisma/schema.prisma`
- 型定義: `packages/shared-types/src/`
- APIエンドポイント: `apps/web/lib/api/server/v1/`
```

### ステップ5: ファイルの保存

計画ファイルを以下のパスに保存する：

```
.claude/qa/artifacts/{YYYY-MM-DD}-{feature-name}-plan.md
```

`feature-name` はIssueタイトルまたは機能説明を英小文字ケバブケースに変換したもの。
例: `user-plan-history` / `regression-2026-06-24`

保存コマンド例:
```bash
# ディレクトリが存在しない場合は作成不要（すでに.gitkeepで初期化済み）
# Writeツールを使って保存する
```

### ステップ6: 完了報告と次のステップ案内

計画ファイルのパスを報告し、`/qa-cases` の実行を案内する：

```
QA計画を作成しました: .claude/qa/artifacts/{filename}-plan.md

次のステップ:
  /qa-cases — 7ペルソナでテストケースCSVを生成
```

---

## 注意事項

- すべてのコミュニケーションは**日本語**で行う
- ペルソナ別のヒントは「最低1つは壊しにいく観点」を必ず含める
- `AccountLimitsValue` に関係する機能は必ずP5（制限値番人）の欄を詳細に記載する
- 既存テストが存在する場合は「すでにカバーされている範囲」を明記する
