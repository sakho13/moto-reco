export type ThemeTokens = {
  colors: {
    background: string
    cloud: string
    cloudHover: string
    cloudActive: string

    // ブランドカラー
    product: string
    productHover: string
    productActive: string
    /** product を背景に敷いたときの文字色 */
    productInk: string

    // 成功カラー
    success: string
    successHover: string
    successActive: string

    // 警告・エラーカラー
    danger: string
    dangerHover: string
    dangerActive: string
    /** danger を背景に敷いたときの文字色 */
    dangerInk: string

    // 注意カラー
    warning: string
    warningHover: string
    warningActive: string

    // 外部サービス連携カラー
    social: string
    socialHover: string
    socialActive: string
    /** social を背景に敷いたときの文字色 */
    socialInk: string

    // テキスト文字色
    ink: string
    inkLight: string
    inkDark: string
  }
  spacing: {
    0: string
    1: string
    2: string
    3: string
    4: string
    5: string
    6: string
    8: string
    10: string
    12: string
    16: string
  }
  fontFamilies: {
    /** 見出し・数値に使う表示用書体（明朝系） */
    display: string
    /** 本文・ラベルに使う書体（和文ゴシック系） */
    body: string
  }
  fontSizes: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
  }
  fontWeights: {
    thin: number
    normal: number
    medium: number
    bold: number
  }
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
  }
  radius: {
    none: string
    sm: string
    md: string
    lg: string
    full: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
  }
  transitions: {
    fast: string
    base: string
    slow: string
  }
}
