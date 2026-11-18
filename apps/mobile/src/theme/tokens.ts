import type { TextStyle } from 'react-native'
import { themes, type ThemeMode, type ThemeTokens } from '@repo/theme'

/** Web の 1rem に相当するピクセル数（ブラウザの既定のフォントサイズ） */
const REM_IN_PX = 16

/**
 * CSS の長さ（`'1.5rem'` / `'12px'` / `'0'`）を React Native の数値に変換する
 *
 * @remarks
 * React Native のスタイルは単位なしの数値（dp）で指定するため、`@repo/theme` の
 * rem 指定を 1rem = 16 として換算する。換算できない値は 0 にする。
 */
export function toDp(cssLength: string): number {
  const value = cssLength.trim()
  if (value.endsWith('rem')) {
    return Number.parseFloat(value) * REM_IN_PX
  }
  const num = Number.parseFloat(value)
  return Number.isFinite(num) ? num : 0
}

/** React Native が受け付ける数値の文字の太さ */
type NumericFontWeight = Extract<NonNullable<TextStyle['fontWeight']>, number>

const NUMERIC_FONT_WEIGHTS: readonly NumericFontWeight[] = [
  100, 200, 300, 400, 500, 600, 700, 800, 900,
]

/**
 * 文字の太さを React Native の型に合わせる
 *
 * @remarks
 * 100 刻み以外の値は、いちばん近い太さに丸める。
 */
export function toFontWeight(weight: number): NumericFontWeight {
  return NUMERIC_FONT_WEIGHTS.reduce((nearest, candidate) =>
    Math.abs(candidate - weight) < Math.abs(nearest - weight)
      ? candidate
      : nearest
  )
}

/** 数値に変換したトークンの集合をキーごとに作る */
function toDpRecord<T extends Record<string | number, string>>(
  record: T
): { [K in keyof T]: number } {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, toDp(value)])
  ) as { [K in keyof T]: number }
}

/**
 * モバイルで使うテーマ
 *
 * @remarks
 * 色と影は `@repo/theme` の値をそのまま使う（React Native 0.76 以降は
 * `boxShadow` に CSS の書式を渡せる）。長さは数値に変換する。
 * 書体は Web の CSS の書体スタックが使えないため、`fonts.ts` で端末ごとに決める。
 */
export type AppTheme = {
  mode: ThemeMode
  colors: ThemeTokens['colors']
  spacing: Record<keyof ThemeTokens['spacing'], number>
  fontSizes: Record<keyof ThemeTokens['fontSizes'], number>
  fontWeights: Record<keyof ThemeTokens['fontWeights'], NumericFontWeight>
  radius: Record<keyof ThemeTokens['radius'], number>
  shadows: ThemeTokens['shadows']
}

/** `@repo/theme` のトークンからモバイル用のテーマを作る */
export function createAppTheme(mode: ThemeMode): AppTheme {
  const tokens = themes.default[mode]
  return {
    mode,
    colors: tokens.colors,
    spacing: toDpRecord(tokens.spacing),
    fontSizes: toDpRecord(tokens.fontSizes),
    fontWeights: {
      thin: toFontWeight(tokens.fontWeights.thin),
      normal: toFontWeight(tokens.fontWeights.normal),
      medium: toFontWeight(tokens.fontWeights.medium),
      bold: toFontWeight(tokens.fontWeights.bold),
    },
    radius: toDpRecord(tokens.radius),
    shadows: tokens.shadows,
  }
}

/** ライト・ダークのテーマ（起動時に一度だけ作る） */
export const APP_THEMES: Record<ThemeMode, AppTheme> = {
  light: createAppTheme('light'),
  dark: createAppTheme('dark'),
}
