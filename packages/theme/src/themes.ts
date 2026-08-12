import { ThemeTokens } from './type'

export const themeNames = ['default'] as const

export const themeModes = ['light', 'dark'] as const

export type ThemeName = (typeof themeNames)[number]

export type ThemeMode = (typeof themeModes)[number]

/**
 * 書体スタック
 *
 * @remarks
 * 見出しに明朝、本文に和文ゴシックを当てて「整備手帳」の語り口を作る。
 * 和文Webフォントは1書体あたり数MBになりビルド時のフォント取得も必要になるため、
 * 各OSに標準搭載されている明朝・ゴシックを指定して転送量ゼロで実現する。
 */
const fontFamilies = {
  display:
    "'Hiragino Mincho ProN', 'Hiragino Mincho Pro', 'Yu Mincho', YuMincho, 'Noto Serif JP', 'Noto Serif CJK JP', serif",
  body: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', YuGothic, 'Noto Sans JP', 'Noto Sans CJK JP', system-ui, sans-serif",
} as const

const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const

const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
} as const

const fontWeights = {
  thin: 100,
  normal: 400,
  medium: 500,
  bold: 700,
} as const

const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const

/**
 * 角丸
 *
 * @remarks
 * 全要素を同じ曲率にすると量産テンプレートの見えになるため、部位ごとに曲率を変えている。
 * sm=プレート・タグ / md=ボタン / lg=カード / full=メーター・ヘッドライト。
 */
const radius = {
  none: '0',
  sm: '0.1875rem',
  md: '0.4375rem',
  lg: '0.875rem',
  full: '9999px',
} as const

const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/**
 * Pattern P「カブ・アイボリー」
 *
 * @remarks
 * スーパーカブの外装パネルを基調としたライトテーマ。
 * アイボリーの塗装面・メッキのモール・タスマニアレッドの塗り分けで構成する。
 * 影はぼかしではなく硬いオフセット（印刷の見当ずれ）＋ inset のハイライト（塗装面の照り）。
 */
const defaultLightTheme: ThemeTokens = {
  colors: {
    background: '#F4EDDF',
    cloud: '#EAE0C9',
    cloudHover: '#DED2B6',
    cloudActive: '#CBBB98',

    // タスマニアレッド（ブランド・主要アクション）
    product: '#9B2226',
    productHover: '#7F181C',
    productActive: '#6B1215',
    productInk: '#FFF3E2',

    // ハンターグリーン
    success: '#3E6B3A',
    successHover: '#345A31',
    successActive: '#2A4A28',

    // 破壊的操作。product と同系色になるため、明度を大きく落として区別する
    danger: '#6E1215',
    dangerHover: '#5A0E11',
    dangerActive: '#470B0D',
    dangerInk: '#FFF3E2',

    // 計器のアンバーランプ
    warning: '#C08A2E',
    warningHover: '#A5741F',
    warningActive: '#8A6018',

    // パールブルー
    social: '#28527A',
    socialHover: '#1F4160',
    socialActive: '#163049',
    socialInk: '#FFF3E2',

    // 青みを抜いた温かみのある黒
    ink: '#241D16',
    inkLight: '#6E6152',
    inkDark: '#14100B',
  },
  spacing,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeight,
  radius,
  shadows: {
    sm: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 2px 3px 0 -1px rgba(120, 95, 55, 0.16)',
    md: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 3px 5px 0 -1px rgba(120, 95, 55, 0.2)',
    lg: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 6px 10px 0 -2px rgba(120, 95, 55, 0.24), 0 20px 40px rgba(70, 52, 26, 0.14)',
  },
  transitions,
}

/**
 * Pattern R「ナイトライド」
 *
 * @remarks
 * Pのダークモード対応版。CT125のハンターグリーンを地色に、
 * ヘッドライトとメーター照明のアンバーだけを発光色として使う。
 * 純黒・青黒（slate系）を地色にせず、文字も白ではなく生成りにして暗所での眩しさを抑える。
 */
const defaultDarkTheme: ThemeTokens = {
  colors: {
    background: '#1A2820',
    cloud: '#22332A',
    cloudHover: '#2A3E33',
    cloudActive: '#33493C',

    // 夜に灯るのはアンバー。赤は暗い地色の上で沈むため主要アクションから外す
    product: '#D9A441',
    productHover: '#F0BC5C',
    productActive: '#B98B2E',
    productInk: '#241D16',

    success: '#5FA36B',
    successHover: '#74B57F',
    successActive: '#4C8757',

    /*
     * テールランプの赤。
     * danger は塗りだけでなく入力エラーの文字色にも使われるため、
     * 暗い地色の上で 4.5:1 を確保できる明度まで上げている。
     */
    danger: '#E0777B',
    dangerHover: '#EA8B8E',
    dangerActive: '#D3666A',
    dangerInk: '#241D16',

    warning: '#E0B45E',
    warningHover: '#EDC576',
    warningActive: '#C39943',

    social: '#7E9CB8',
    socialHover: '#94AEC7',
    socialActive: '#708DA8',
    socialInk: '#16211A',

    // 白ではなく生成り
    ink: '#EDE3CE',
    inkLight: '#AEBBAC',
    inkDark: '#FBF6EA',
  },
  spacing,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeight,
  radius,
  shadows: {
    sm: 'inset 0 1px 0 rgba(237, 227, 206, 0.06), 2px 3px 0 -1px rgba(0, 0, 0, 0.4)',
    md: 'inset 0 1px 0 rgba(237, 227, 206, 0.06), 3px 5px 0 -1px rgba(0, 0, 0, 0.45)',
    lg: 'inset 0 1px 0 rgba(237, 227, 206, 0.08), 6px 10px 0 -2px rgba(0, 0, 0, 0.5), 0 20px 44px rgba(0, 0, 0, 0.5)',
  },
  transitions,
}

export const themes: Record<ThemeName, Record<ThemeMode, ThemeTokens>> = {
  default: {
    light: defaultLightTheme,
    dark: defaultDarkTheme,
  },
}
