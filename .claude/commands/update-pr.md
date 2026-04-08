# PRのDescription更新

あなたは現在のブランチのPull RequestのDescriptionを最新の変更内容に基づいて更新する専門家です。

## 実行手順

### 1. 現在のPR情報の取得

現在のブランチのオープンなPRを取得してください:

```bash
gh pr view --json number,title,body,baseRefName,url | cat
```

PRが存在しない場合は、ユーザーに `/create-pr` コマンドでPRを作成するよう案内してください。

### 2. 変更内容の分析

ベースブランチとの差分を分析してください:

```bash
# ベースブランチとの差分コミット一覧
git log {baseRefName}..HEAD --oneline | cat

# 変更ファイル一覧
git diff {baseRefName}..HEAD --name-status | cat

# 差分の統計
git diff {baseRefName}..HEAD --stat | cat
```

`{baseRefName}` は手順1で取得したPRのベースブランチ名を使用してください。

### 3. 既存のDescriptionの確認

手順1で取得した既存のPR Descriptionを確認してください。
`Closes #XX` などのIssueリンクが含まれている場合は、更新後も必ず引き継いでください。

### 4. 新しいPR Descriptionの生成

最新の変更内容をもとに、以下のフォーマットで日本語のPR Descriptionを再生成してください:

```markdown
## 概要
[変更内容の要約を2〜3文で記述]

## 変更内容

<!-- 変更内容を機能・実装テーマごとにサブセクションに分けてください。
     Issueのスコープ外の変更（lint修正・型修正・無関係なバグ修正など）は「その他の修正」にまとめてください。
     該当するサブセクションのみを出力し、空のセクションは省略してください。 -->

### {機能・実装テーマ名}
| ファイル | 変更種別 | 内容 |
| --- | --- | --- |
| `短縮パス/ファイル名` | 追加/修正/削除 | 変更内容の説明 |

### その他の修正
| ファイル | 変更種別 | 内容 |
| --- | --- | --- |
| `短縮パス/ファイル名` | 追加/修正/削除 | 変更内容の説明 |

## 影響範囲
- [影響するファイル・機能・コンポーネント]
- [影響するファイル・機能・コンポーネント]

## テストプラン
[動作確認に必要な手順をチェックリスト形式で記述]
- [ ] [確認項目1]
- [ ] [確認項目2]

Closes #{issue_number}
```

既存のDescriptionに `Closes #XX` がある場合は必ず末尾に引き継いでください。

### 5. 更新内容をユーザーに提示して確認

新しいDescriptionを整形されたMarkdown形式でユーザーに提示し、内容の確認を求めてください。
必要に応じてタイトルの更新提案も行ってください。

### 6. PRの更新

ユーザーが承認したら、以下のコマンドでPRを更新してください:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number} \
  --method PATCH \
  --field body='[生成したDescription]' \
  --jq '.html_url'
```

> **注意:** `gh pr edit` は内部で `projectCards` フィールドを含むGraphQLクエリを発行するため、GitHub の Projects (classic) 廃止に伴いエラーが発生する場合があります。そのため `gh api` で直接PATCHリクエストを送る方法を使用してください。

タイトルも更新する場合は `--field title='新しいタイトル'` を追加してください。

`{owner}` と `{repo}` は手順1で取得したPRのURLから抽出してください。

更新後、PRのURLをユーザーに伝えてください。

## 注意事項

- すべてのコミュニケーションは日本語で行ってください
- 既存のIssueリンク（`Closes #XX`）は必ず引き継ぐこと
- PRタイトルは変更内容に応じて更新提案を行うが、変更するかはユーザーに確認すること