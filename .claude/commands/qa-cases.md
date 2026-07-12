# QAテストケース生成

あなたはQAオーケストレータです。
`.claude/qa/artifacts/` の計画ファイルを読み込み、7ペルソナを**並列で**起動してテストケースCSVを生成します。

**引数:**
- 引数なし — 最新の `*-plan.md` ファイルを自動選択
- `{plan-file-path}` — 計画ファイルを明示指定（例: `.claude/qa/artifacts/2026-06-24-user-plan-history-plan.md`）

---

## 実行手順

### ステップ1: 計画ファイルの読み込み

```bash
# 引数なしの場合、最新の計画ファイルを取得
ls -t .claude/qa/artifacts/*-plan.md | head -1 | cat
```

計画ファイルのパスを確認してから Read ツールで内容を読み込む。

### ステップ2: 既存master/の確認（重複採番防止）

```bash
# 既存のmaster/配下のCSVからテストIDを確認
ls .claude/qa/master/*.csv 2>/dev/null | cat
```

master/ にCSVが存在する場合、最大テストID連番を確認して採番の起点とする。

### ステップ3: 7ペルソナを並列起動

Workflow ツールを使って以下のスクリプトを実行する。

**Workflowスクリプト:**

```javascript
export const meta = {
  name: 'qa-cases',
  description: '7ペルソナが並列でテストケースを生成しCSVに集約する',
  phases: [
    { title: 'テストケース生成', detail: '7ペルソナが並列でCSV行を生成' },
    { title: '集約・保存', detail: 'CSV集約・テストID採番・ファイル保存' },
  ],
}

const PERSONAS = [
  { id: 'P1', name: '新規ユーザー' },
  { id: 'P2', name: 'パワーユーザー' },
  { id: 'P3', name: '攻撃者' },
  { id: 'P4', name: 'データ整合性担当' },
  { id: 'P5', name: '制限値番人' },
  { id: 'P6', name: '回帰担当' },
  { id: 'P7', name: '仕様懐疑担当' },
]

const CASES_SCHEMA = {
  type: 'object',
  required: ['persona', 'persona_name', 'cases'],
  properties: {
    persona: { type: 'string' },
    persona_name: { type: 'string' },
    cases: {
      type: 'array',
      items: {
        type: 'object',
        required: ['requirement_id','test_id','priority','test_level','domain','persona','quality_characteristic','test_type','precondition','steps','expected_result','is_negative','automation','test_file_path','implementation_status','test_basis','notes','created_at'],
        properties: {
          requirement_id: { type: 'string' },
          test_id: { type: 'string' },
          priority: { type: 'string', enum: ['P0','P1','P2','P3'] },
          test_level: { type: 'string', enum: ['unit','api','e2e'] },
          domain: { type: 'string' },
          persona: { type: 'string' },
          quality_characteristic: { type: 'string' },
          test_type: { type: 'string', enum: ['正常系','異常系','境界値','回帰'] },
          precondition: { type: 'string' },
          steps: { type: 'string' },
          expected_result: { type: 'string' },
          is_negative: { type: 'string', enum: ['true','false'] },
          automation: { type: 'string', enum: ['Vitest','Playwright','手動'] },
          test_file_path: { type: 'string' },
          implementation_status: { type: 'string', enum: ['未実装','実装済み','スキップ'] },
          test_basis: { type: 'string' },
          notes: { type: 'string' },
          created_at: { type: 'string' },
        }
      }
    }
  }
}

phase('テストケース生成')

const planContent = args.planContent
const requirementId = args.requirementId

const results = await parallel(PERSONAS.map(p => () =>
  agent(
    `あなたはQAエンジニアエージェントです。ペルソナ ${p.id}（${p.name}）として動作してください。

## ペルソナ定義
.claude/qa/personas.md の "${p.id}: ${p.name}" セクションを Read ツールで読み込んでください。

## CSV仕様
.claude/qa/csv-format.md を Read ツールで読み込んでください。

## QA計画
${planContent}

## 指示
上記QA計画と ${p.id} ペルソナの視点に基づき、テストケースを最低3件・最大10件生成してください。

制約:
- ペルソナの視点から逸脱しない
- 仕様が不明な箇所は空欄のままにする
- セル値にカンマが含まれる場合はダブルクォートで囲む（例: "role=USER, plan=FREE"）
- 複数ステップは <br> で区切る
- test_id は T-{DOMAIN_UPPER}-XXX の仮採番でよい
- requirement_id は Issue番号の数字のみ（#なし）を使う: "${requirementId}"
- created_at は本日の日付を使う`,
    {
      label: `${p.id}-${p.name}`,
      phase: 'テストケース生成',
      schema: CASES_SCHEMA,
      agentType: 'qa-engineer',
    }
  )
))

phase('集約・保存')

const allCases = results
  .filter(Boolean)
  .flatMap(r => r.cases)

log(`総テストケース数: ${allCases.length}件（7ペルソナ合計）`)

return { cases: allCases, personas: results.filter(Boolean).map(r => ({ persona: r.persona, name: r.persona_name, count: r.cases.length })) }
```

### ステップ4: テストIDの採番

Workflowの結果を受け取り、テストIDを正式採番する：

- 各ケースの `domain` からドメインコードを取得
- `T-{DOMAIN_UPPER}-{3桁連番}` で採番
- ドメインごとに連番をリセット（master/の既存IDと重複しないよう確認）

### ステップ5: CSVファイルの保存

計画ファイルのファイル名から機能名を取得し、以下のパスに保存：

```
.claude/qa/artifacts/{YYYY-MM-DD}-{feature-name}-cases.csv
```

CSVフォーマット（ヘッダー行 + データ行）:
```
requirement_id,test_id,priority,test_level,domain,persona,quality_characteristic,test_type,precondition,steps,expected_result,is_negative,automation,test_file_path,implementation_status,test_basis,notes,created_at
```

### ステップ6: サマリーの出力

```
テストケース生成完了: .claude/qa/artifacts/{filename}-cases.csv

## サマリー
- 総件数: {N}件
- ペルソナ別:
  - P1 新規ユーザー: {n}件
  - P2 パワーユーザー: {n}件
  - ...
- 優先度別:
  - P0（クリティカル）: {n}件
  - P1（高）: {n}件
  - P2（中）: {n}件
  - P3（低）: {n}件
- テストレベル別:
  - unit: {n}件
  - api: {n}件
  - e2e: {n}件

次のステップ:
  /qa-approve — レビュー後にmaster/へ昇格
```

---

## 注意事項

- すべてのコミュニケーションは**日本語**で行う
- Workflow args には `planContent`（計画ファイルの内容）と `requirementId`（Issue番号）を渡す
- 7ペルソナは必ず**並列**で起動する（直列実行は禁止）
- ペルソナの出力が null の場合（エラー）はスキップしてサマリーに記載する
