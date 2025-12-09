/**
 * OKLCHカラースペースの値を表す型
 * Format: "oklch(L% C H)"
 * - L (Lightness): 0-100%
 * - C (Chroma): 0-0.4+
 * - H (Hue): 0-360度
 */
export type OklchColor = `oklch(${string}% ${string} ${string})`

/**
 * カラースケールの階調
 */
export type ColorScale =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950

/**
 * カラーパレットオブジェクト
 */
export type ColorPalette = Record<ColorScale, OklchColor>

/**
 * プリミティブカラー名
 */
export type PrimitiveColorName =
  | 'cerulean'
  | 'brickEmber'
  | 'honeydew'
  | 'frostedBlue'
  | 'oxfordNavy'

/**
 * すべてのプリミティブカラー
 */
export type PrimitiveColors = Record<PrimitiveColorName, ColorPalette>
