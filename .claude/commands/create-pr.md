# PRの作成

あなたは現在のブランチから `develop` ブランチへのPull Requestを作成する専門家です。

## 実行手順

### 1. 現在のブランチ情報の取得

```bash
git branch --show-current
```

### 2. 変更内容の分析

以下のコマンドを実行して変更内容を把握してください:

```bash
# developとの差分コミット一覧
git log develop..HEAD --oneline | cat

# 変更ファイル一覧
git diff develop..HEAD --name-status | cat

# 差分の統計
git diff develop..HEAD --stat | cat
```

### 3. Issue情報の取得（引数が指定された場合）

`$ARGUMENTS` にIssue番号（例: `207`）またはGitHub Issue URL（例: `https://github.com/owner/repo/issues/207`）が指定された場合:

- Issue番号またはURLをそのまま `gh issue view` に渡してIssue情報を取得してください
- `Closes #XX` に使うIssue番号はURLから末尾の数値を抽出してください

```bash
gh issue view $ARGUMENTS --json title,body,labels,assignees,state | cat
```

### 4. PR Descriptionの生成

取得した情報をもとに、以下のフォーマットで日本語のPR Descriptionを作成してください:

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

Issue番号が指定されていない場合は `Closes #XX` の行を省略してください。

### 5. PRタイトルとDescriptionをユーザーに提示して確認

生成したPRタイトルとDescriptionを整形されたMarkdown形式でユーザーに提示し、内容の確認を求めてください。

### 6. PRの作成

ユーザーが承認したら、以下のコマンドでPRを作成してください:

```bash
gh pr create \
  --base develop \
  --title "PRタイトル" \
  --body "$(cat <<'EOF'
[生成したDescription]
EOF
)"
```

作成後、PRのURLをユーザーに伝えてください。

## 注意事項

- すべてのコミュニケーションは日本語で行ってください
- PRタイトルはIssueタイトルや変更内容から簡潔に生成してください
- Issue番号はURLと番号どちらでも受け付けます（`$ARGUMENTS` の末尾の数値を抽出）
- 引数は `$ARGUMENTS` として参照してください（スラッシュコマンドの引数から自動設定されます）