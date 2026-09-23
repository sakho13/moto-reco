#!/usr/bin/env node
/**
 * 未定義CSS変数（var(--xxx)）の検出スクリプト
 *
 * @remarks
 * `packages/theme/src/themes.ts` に存在しないトークン名を `var(--xxx)` で
 * 参照しても、ブラウザは黙って無視するだけでエラーにならない。
 * その結果、色やフォント指定が「効いていないのに誰も気づかない」事故が起きた
 * （2026年9月・未定義テーマ変数の修正対応 参照）。
 *
 * このスクリプトは
 *   1. packages/theme/src/themes.ts のトークン定義（colors / spacing / ...）
 *   2. apps/web/app/globals.css で直接定義されているカスタムプロパティ
 *   3. 走査対象配下の .css / .tsx / .ts でローカルに定義されているカスタム
 *      プロパティ（例: TouringModeView.module.css の --card-*）
 * を「定義済み」として収集し、走査対象の var(--xxx) 参照がそのいずれにも
 * 一致しない場合はエラーとして報告する。
 *
 * 走査対象は apps/web だけでなく packages/ui/src も含める。
 * 共通部品（Tabs / Checkbox / ToggleSection など）側の未定義参照が
 * apps/web だけを見ていたために検出をすり抜けていたため。
 *
 * 使い方:
 *   node apps/web/scripts/check-css-tokens.mjs
 *   pnpm --filter web check:css-tokens
 */

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
/**
 * 走査対象のルート。
 * 共通部品のCSSも同じテーマトークンを参照するため、packages/ui も対象に含める。
 */
const scanRoots = [
  path.resolve(__dirname, '..'),
  path.resolve(repoRoot, 'packages/ui/src'),
]

/**
 * `key: value,` 形式のオブジェクトリテラルから最上位のキー名だけを雑に抜き出す。
 * themes.ts はプレーンなオブジェクトリテラルのみで構成されているため、
 * 簡易的な正規表現で十分（AST解析は行わない）。
 */
function extractTopLevelKeys(objectBody) {
  const keys = []
  for (const m of objectBody.matchAll(/^\s*(['"]?[\w-]+['"]?):\s/gm)) {
    keys.push(m[1].replace(/['"]/g, ''))
  }
  return keys
}

function extractBlock(source, startPattern, endPattern = /\n\s*\},?/) {
  const start = source.match(startPattern)
  if (!start) return null
  const from = start.index + start[0].length
  const rest = source.slice(from)
  const end = rest.match(endPattern)
  if (!end) return null
  return rest.slice(0, end.index)
}

function collectThemeTokens() {
  const themeSrc = readFileSync(
    path.join(repoRoot, 'packages/theme/src/themes.ts'),
    'utf-8'
  )
  const defined = new Set()

  const sections = [
    { pattern: /colors:\s*\{/, prefix: 'color' },
    { pattern: /shadows:\s*\{/, prefix: 'shadow' },
  ]
  for (const { pattern, prefix } of sections) {
    const body = extractBlock(themeSrc, pattern)
    if (!body) continue
    for (const key of extractTopLevelKeys(body)) {
      defined.add(`--${prefix}-${key}`)
    }
  }

  const constSections = [
    { name: 'spacing', prefix: 'spacing' },
    { name: 'fontSizes', prefix: 'font-size' },
    { name: 'fontWeights', prefix: 'font-weight' },
    { name: 'lineHeight', prefix: 'line-height' },
    { name: 'radius', prefix: 'radius' },
    { name: 'transitions', prefix: 'transition' },
    { name: 'fontFamilies', prefix: 'font-family' },
  ]
  for (const { name, prefix } of constSections) {
    const body = extractBlock(
      themeSrc,
      new RegExp(`const ${name} = \\{`),
      /\n\} as const/
    )
    if (!body) continue
    for (const key of extractTopLevelKeys(body)) {
      defined.add(`--${prefix}-${key}`)
    }
  }

  return defined
}

const TARGET_EXTENSIONS = new Set(['.css', '.ts', '.tsx'])
const IGNORED_DIRS = new Set(['node_modules', '.next', '.turbo'])

function collectFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      collectFiles(path.join(dir, entry.name), acc)
      continue
    }
    if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      acc.push(path.join(dir, entry.name))
    }
  }
  return acc
}

async function main() {
  const defined = collectThemeTokens()

  const files = scanRoots.flatMap((root) => collectFiles(root))

  const usages = new Map() // varName -> Set<file>
  const localDefs = new Set()

  const definitionRe = /(--[\w-]+)\s*:\s*[^;]+;/g
  const usageRe = /var\(\s*(--[\w-]+)/g

  for (const file of files) {
    const text = readFileSync(file, 'utf-8')

    for (const m of text.matchAll(definitionRe)) {
      localDefs.add(m[1])
    }
    for (const m of text.matchAll(usageRe)) {
      const name = m[1]
      if (!usages.has(name)) usages.set(name, new Set())
      usages.get(name).add(path.relative(repoRoot, file))
    }
  }

  const missing = []
  for (const [name, fileSet] of usages) {
    if (defined.has(name) || localDefs.has(name)) continue
    missing.push({ name, files: [...fileSet].sort() })
  }
  missing.sort((a, b) => a.name.localeCompare(b.name))

  if (missing.length === 0) {
    console.log(
      `✅ 未定義のCSS変数は見つかりませんでした（テーマ定義 ${defined.size}件 / ローカル定義 ${localDefs.size}件と突き合わせ済み）`
    )
    return
  }

  console.error(
    `❌ packages/theme に存在しない CSS 変数が ${missing.length} 件見つかりました:\n`
  )
  for (const { name, files: fileList } of missing) {
    console.error(`  ${name}`)
    for (const f of fileList) {
      console.error(`    - ${f}`)
    }
  }
  console.error(
    '\npackages/theme/src/themes.ts のトークン一覧、または対象ファイル内のローカル定義（例: --card-*）を確認してください。'
  )
  process.exitCode = 1
}

main()
