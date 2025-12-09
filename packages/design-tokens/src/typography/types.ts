/**
 * フォントファミリー定義
 */
export type FontFamily = {
  sans: string[]
  serif: string[]
  mono: string[]
}

/**
 * フォントサイズスケール
 */
export type FontSizeScale =
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'

/**
 * フォントウェイト
 */
export type FontWeight = {
  light: number
  normal: number
  medium: number
  semibold: number
  bold: number
}

/**
 * 行高
 */
export type LineHeight = {
  none: number
  tight: number
  snug: number
  normal: number
  relaxed: number
  loose: number
}

/**
 * 字間
 */
export type LetterSpacing = {
  tighter: string
  tight: string
  normal: string
  wide: string
  wider: string
}

/**
 * タイポグラフィトークン
 */
export type TypographyTokens = {
  fontFamily: FontFamily
  fontSize: Record<FontSizeScale, string>
  fontWeight: FontWeight
  lineHeight: LineHeight
  letterSpacing: LetterSpacing
}
