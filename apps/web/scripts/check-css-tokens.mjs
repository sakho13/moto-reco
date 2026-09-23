#!/usr/bin/env node
/**
 * テーマ機構から外れたCSSの検出スクリプト
 *
 * 次の3点を検査する。
 *   1. 未定義のCSS変数（var(--xxx)）参照
 *   2. テーマモードを条件に値を出し分けるセレクタ
 *   3. 固定色の直書き
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
 * テーマ切り替えは ThemeContext が root.style.setProperty() でトークンの値
 * そのものを差し替えることで成立する。CSS側にモード分岐を書くと同じ値を
 * 二重管理することになるため、検査2で禁止する。
 * 検査3は、トークンを迂回した固定色がテーマ切り替えに追従しない事故を防ぐ。
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
/** 走査対象のルート */
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
/** 生成物のディレクトリ。走査しても直せないため除外する */
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'build',
  'storybook-static',
  'playwright-report',
  'test-results',
])

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

/* ========================================================================
   検査2・3の共通処理
   ======================================================================== */

/** CSSのコメントと文字列リテラルを同じ長さの空白に潰す（行番号を保つため） */
function blankOutCommentsAndStrings(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const two = text.slice(i, i + 2)
    if (two === '/*') {
      const end = text.indexOf('*/', i + 2)
      const stop = end === -1 ? text.length : end + 2
      out += text.slice(i, stop).replace(/[^\n]/g, ' ')
      i = stop
      continue
    }
    if (text[i] === '"' || text[i] === "'") {
      const quote = text[i]
      let j = i + 1
      while (j < text.length && text[j] !== quote) {
        if (text[j] === '\\') j++
        j++
      }
      const stop = Math.min(j + 1, text.length)
      out += text.slice(i, stop).replace(/[^\n]/g, ' ')
      i = stop
      continue
    }
    out += text[i]
    i++
  }
  return out
}

/**
 * JS/TSのコメントだけを同じ長さの空白に潰す。
 *
 * @remarks
 * JS/TS では色は文字列リテラルとして書かれるため、文字列は潰さない。
 */
function blankOutJsComments(text) {
  let out = ''
  let i = 0
  while (i < text.length) {
    const two = text.slice(i, i + 2)
    if (two === '/*') {
      const end = text.indexOf('*/', i + 2)
      const stop = end === -1 ? text.length : end + 2
      out += text.slice(i, stop).replace(/[^\n]/g, ' ')
      i = stop
      continue
    }
    if (two === '//') {
      const end = text.indexOf('\n', i)
      const stop = end === -1 ? text.length : end
      out += text.slice(i, stop).replace(/[^\n]/g, ' ')
      i = stop
      continue
    }
    out += text[i]
    i++
  }
  return out
}

function lineOf(text, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (text[i] === '\n') line++
  return line
}

/* ========================================================================
   検査2: テーマモードセレクタ
   ======================================================================== */

const THEME_MODE_SELECTOR_RE =
  /(html\[data-theme-mode[^\]]*\]|:root\[data-theme[^\]]*\]|\[data-theme=[^\]]*\]|@media[^{]*prefers-color-scheme[^{]*)/g

/**
 * `color-scheme` だけを宣言するブロックは検査2の対象外。
 *
 * @remarks
 * `color-scheme` は色の出し分けではなく、スクロールバーやフォームコントロールの
 * ネイティブUIをどちらの配色で描くかをブラウザに伝える宣言なので、
 * テーマモードごとに指定する必要がある。
 */
function isColorSchemeOnlyBlock(css, braceIndex) {
  const end = css.indexOf('}', braceIndex)
  if (end === -1) return false
  const body = css.slice(braceIndex + 1, end)
  const decls = body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
  return decls.length > 0 && decls.every((d) => d.startsWith('color-scheme'))
}

function checkThemeModeSelectors(files) {
  const violations = []
  for (const file of files) {
    if (path.extname(file) !== '.css') continue
    const raw = readFileSync(file, 'utf-8')
    const css = blankOutCommentsAndStrings(raw)
    for (const m of css.matchAll(THEME_MODE_SELECTOR_RE)) {
      const braceIndex = css.indexOf('{', m.index)
      if (braceIndex !== -1 && isColorSchemeOnlyBlock(css, braceIndex)) continue
      violations.push({
        file: path.relative(repoRoot, file),
        line: lineOf(css, m.index),
        // 空白に潰す前の原文を見せる
        text: raw.slice(m.index, m.index + m[0].length).trim(),
      })
    }
  }
  return violations
}

/* ========================================================================
   検査3: 固定色の直書き
   ======================================================================== */

/** 質感（ハイライト・落ち影）を作るための半透明の白黒オーバーレイだけ許可する */
const ALLOWED_OVERLAY_RE = /^rgba\(\s*(255,\s*255,\s*255|0,\s*0,\s*0)\s*,[^)]*\)$/

const COLOR_KEYWORDS = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
  'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood',
  'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk',
  'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
  'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
  'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkturquoise', 'darkviolet', 'deeppink',
  'deepskyblue', 'dimgray', 'dodgerblue', 'firebrick', 'floralwhite',
  'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
  'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred',
  'indigo', 'ivory', 'khaki', 'lavender', 'lawngreen', 'lightblue',
  'lightcoral', 'lightcyan', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightyellow',
  'lime', 'limegreen', 'magenta', 'maroon', 'mediumblue', 'mediumpurple',
  'midnightblue', 'mintcream', 'mistyrose', 'navy', 'oldlace', 'olive',
  'olivedrab', 'orange', 'orangered', 'orchid', 'palegreen', 'paleturquoise',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon',
  'sandybrown', 'seagreen', 'seashell', 'sienna', 'silver', 'skyblue',
  'slateblue', 'slategray', 'springgreen', 'steelblue', 'tan', 'teal',
  'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke',
  'yellow', 'yellowgreen',
])

/** 色を取りうるプロパティだけを見る。`animation: none red` のような誤検出を避ける */
const COLOR_PROPERTY_RE =
  /(^|-)(color|background|background-color|border|border-color|border-top|border-right|border-bottom|border-left|border-top-color|border-right-color|border-bottom-color|border-left-color|outline|outline-color|fill|stroke|box-shadow|text-shadow|caret-color|text-decoration-color|accent-color|column-rule|column-rule-color)$/

const FUNCTION_COLOR_RE = /\b(rgba?|hsla?|hwb|lab|lch)\([^)]*\)/g
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/g
/** JS/TSで「文字列リテラル全体が16進カラー」になっているもの */
const QUOTED_HEX_COLOR_RE = /(['"`])(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))\1/g

/**
 * 検査3の既知の例外。
 * 対象ファイルとセレクタの組で指定する。
 */
const HARDCODED_COLOR_ALLOWLIST = [
  {
    file: 'apps/web/app/app/(protected)/my-bike/[id]/touring-plans/[planId]/page.module.css',
    selector: '.googleMapsLink',
    reason: '地図タイル上の Google マップ導線。Google のブランド配色に追従させる',
  },
  {
    file: 'apps/web/app/app/(protected)/my-bike/[id]/tourings/[touringId]/page.module.css',
    selector: '.googleMapsLink',
    reason: '地図タイル上の Google マップ導線。Google のブランド配色に追従させる',
  },
]

function isAllowlisted(relFile, selector) {
  return HARDCODED_COLOR_ALLOWLIST.some(
    (e) => e.file === relFile && selector.includes(e.selector)
  )
}

/** 宣言を `{ property, value, index, selector }` の列に分解する */
function* eachDeclaration(css) {
  const selectorStack = []
  let buffer = ''
  let bufferStart = 0
  for (let i = 0; i < css.length; i++) {
    const ch = css[i]
    if (ch === '{') {
      selectorStack.push(buffer.trim())
      buffer = ''
      bufferStart = i + 1
      continue
    }
    if (ch === '}' || ch === ';') {
      const decl = buffer.trim()
      const colon = decl.indexOf(':')
      if (colon > 0) {
        const leading = buffer.length - buffer.replace(/^\s+/, '').length
        yield {
          property: decl.slice(0, colon).trim(),
          value: decl.slice(colon + 1).trim(),
          index: bufferStart + leading,
          selector: selectorStack.join(' '),
        }
      }
      if (ch === '}') selectorStack.pop()
      buffer = ''
      bufferStart = i + 1
      continue
    }
    buffer += ch
  }
}

function findHardcodedColorsInValue(property, value) {
  const found = []
  const prop = property.toLowerCase()
  // カスタムプロパティ（--xxx: ...）も色を持つため対象に含める
  const isColorProp = prop.startsWith('--') || COLOR_PROPERTY_RE.test(prop)

  for (const m of value.matchAll(FUNCTION_COLOR_RE)) {
    const fn = m[0].replace(/\s+/g, ' ')
    if (ALLOWED_OVERLAY_RE.test(fn)) continue
    found.push(fn)
  }
  for (const m of value.matchAll(HEX_COLOR_RE)) found.push(m[0])

  if (isColorProp) {
    for (const m of value.matchAll(/\b[a-zA-Z]+\b/g)) {
      if (COLOR_KEYWORDS.has(m[0].toLowerCase())) found.push(m[0])
    }
  }
  return found
}

function checkHardcodedColors(files) {
  const violations = []
  for (const file of files) {
    if (path.extname(file) !== '.css') continue
    const relFile = path.relative(repoRoot, file)
    const css = blankOutCommentsAndStrings(readFileSync(file, 'utf-8'))
    for (const decl of eachDeclaration(css)) {
      const found = findHardcodedColorsInValue(decl.property, decl.value)
      if (found.length === 0) continue
      if (isAllowlisted(relFile, decl.selector)) continue
      violations.push({
        file: relFile,
        line: lineOf(css, decl.index),
        selector: decl.selector,
        text: `${decl.property}: ${decl.value}`,
        found,
      })
    }
  }
  return violations
}

/* ========================================================================
   検査3の補助: .ts / .tsx の固定色（警告のみ）
   ======================================================================== */

/**
 * CSSモジュールの外にある固定色。
 * ブランド配色・地図タイル上のマーカー・ThemeProvider の外で描画される画面は
 * テーマに追従させないため、既知の例外として扱う。
 */
const SCRIPT_COLOR_KNOWN_EXCEPTIONS = [
  'apps/web/components/icons/GoogleIcon.tsx',
  'apps/web/components/map/LocationPickerMapInner.tsx',
  'apps/web/components/touring/TouringRouteMapInner.tsx',
  'apps/web/app/global-error.tsx',
]

function checkScriptColors(files) {
  const warnings = []
  for (const file of files) {
    const ext = path.extname(file)
    if (ext !== '.ts' && ext !== '.tsx') continue
    const relFile = path.relative(repoRoot, file)
    if (SCRIPT_COLOR_KNOWN_EXCEPTIONS.includes(relFile)) continue
    const src = blankOutJsComments(readFileSync(file, 'utf-8'))
    const found = new Set()
    for (const m of src.matchAll(FUNCTION_COLOR_RE)) {
      const fn = m[0].replace(/\s+/g, ' ')
      if (ALLOWED_OVERLAY_RE.test(fn)) continue
      found.add(fn)
    }
    /*
     * `#` で始まる3桁の数字は Issue 番号としても現れるため、
     * 文字列リテラル全体が色指定になっているものだけを拾う。
     */
    for (const m of src.matchAll(QUOTED_HEX_COLOR_RE)) found.add(m[2])
    if (found.size > 0) warnings.push({ file: relFile, found: [...found] })
  }
  return warnings
}

async function main() {
  const defined = collectThemeTokens()

  const files = scanRoots.flatMap((root) => collectFiles(root))
  let failed = false

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
  } else {
    failed = true
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
      '\npackages/theme/src/themes.ts のトークン一覧、または対象ファイル内のローカル定義（例: --card-*）を確認してください。\n'
    )
  }

  const themeModeViolations = checkThemeModeSelectors(files)
  if (themeModeViolations.length === 0) {
    console.log('✅ テーマモードを条件に値を出し分けるセレクタはありません')
  } else {
    failed = true
    console.error(
      `❌ テーマモード依存のセレクタが ${themeModeViolations.length} 件見つかりました:\n`
    )
    for (const v of themeModeViolations) {
      console.error(`  ${v.file}:${v.line}`)
      console.error(`    ${v.text}`)
    }
    console.error(
      '\nThemeContext がトークンの値そのものを差し替えるため、CSS側の分岐は不要です。' +
        '\n両テーマで成立しない場合は分岐を足すのではなくトークンを選び直してください。\n'
    )
  }

  const colorViolations = checkHardcodedColors(files)
  if (colorViolations.length === 0) {
    console.log('✅ CSSに固定色の直書きはありません')
  } else {
    failed = true
    console.error(
      `❌ CSSへの固定色の直書きが ${colorViolations.length} 件見つかりました:\n`
    )
    for (const v of colorViolations) {
      console.error(`  ${v.file}:${v.line}  ${v.selector}`)
      console.error(`    ${v.text}   → ${v.found.join(', ')}`)
    }
    console.error(
      '\npackages/theme/src/themes.ts のトークンを var(--color-*) で参照してください。' +
        '\n質感（ハイライト・落ち影）を作る rgba(255,255,255,x) / rgba(0,0,0,x) のみ許可されます。\n'
    )
  }

  const scriptColorWarnings = checkScriptColors(files)
  if (scriptColorWarnings.length > 0) {
    console.warn(
      `⚠️  CSSモジュールの外に固定色が ${scriptColorWarnings.length} ファイル見つかりました（警告）:\n`
    )
    for (const w of scriptColorWarnings) {
      console.warn(`  ${w.file}`)
      console.warn(`    ${w.found.join(', ')}`)
    }
    console.warn(
      '\n意図的な指定であれば SCRIPT_COLOR_KNOWN_EXCEPTIONS に理由とともに追加してください。\n'
    )
  }

  if (failed) process.exitCode = 1
}

main()
