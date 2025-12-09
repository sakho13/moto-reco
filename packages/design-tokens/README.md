# @repo/design-tokens

モノレポ全体で使用するデザイントークンパッケージ

## 概要

このパッケージは、カラー、タイポグラフィ、スペーシング、ブレークポイントなどのデザイントークンを提供します。TypeScript/JavaScript オブジェクトとして定義されており、Web (Next.js) アプリケーションで使用できます。

## インストール

`package.json` に依存関係を追加:

```json
{
  "dependencies": {
    "@repo/design-tokens": "workspace:*"
  }
}
```

## 使用方法

### カラー

```typescript
import { primitiveColors } from '@repo/design-tokens';

// OKLCHカラー値を取得
const blue500 = primitiveColors.cerulean[500]; // "oklch(61.12% 0.086 237.74)"
const red500 = primitiveColors.brickEmber[500]; // "oklch(62.80% 0.258 29.23)"
```

### タイポグラフィ

```typescript
import { typography } from '@repo/design-tokens';

// フォントサイズ
const baseFontSize = typography.fontSize.base; // "1rem" (16px)
const h1Size = typography.fontSize['4xl']; // "2.25rem" (36px)

// フォントファミリー
const sansStack = typography.fontFamily.sans; // ["ui-sans-serif", "system-ui", ...]

// フォントウェイト
const boldWeight = typography.fontWeight.bold; // 700
```

### スペーシング

```typescript
import { spacing } from '@repo/design-tokens';

// スペーシング値
const padding = spacing[4]; // "1rem" (16px)
const margin = spacing[8]; // "2rem" (32px)
```

### ブレークポイント

```typescript
import { breakpoints } from '@repo/breakpoints';

// レスポンシブブレークポイント
const tablet = breakpoints.md; // "768px"
const desktop = breakpoints.lg; // "1024px"
```

## カラーパレット

5つのカラーファミリーを提供し、それぞれ11階調（50〜950）を持ちます。

| カラー名 | 説明 | 用途 |
|---------|------|------|
| **cerulean** | 青系カラー | メインブランドカラー候補 |
| **brickEmber** | 赤/オレンジ系カラー | アクセント、警告 |
| **honeydew** | 緑系カラー | 成功、確認 |
| **frostedBlue** | 水色系カラー | 情報 |
| **oxfordNavy** | 紺系カラー | ダーク系アクセント |

### カラースケール

各カラーは以下の階調を持ちます:

- `50`: 最も明るい
- `100`, `200`, `300`, `400`: 明るい階調
- `500`: ベースカラー
- `600`, `700`, `800`, `900`: 暗い階調
- `950`: 最も暗い

## 使用例

### React コンポーネントでの使用

```tsx
import { primitiveColors, spacing, typography } from '@repo/design-tokens';

export function Button() {
  return (
    <button
      style={{
        backgroundColor: primitiveColors.cerulean[500],
        color: '#fff',
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        borderRadius: spacing[2],
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Click me
    </button>
  );
}
```

### CSS-in-JS での使用

```typescript
import styled from 'styled-components';
import { primitiveColors, spacing, typography } from '@repo/design-tokens';

const Card = styled.div`
  background-color: ${primitiveColors.frostedBlue[50]};
  border: 1px solid ${primitiveColors.frostedBlue[200]};
  border-radius: ${spacing[3]};
  padding: ${spacing[6]};
  font-family: ${typography.fontFamily.sans.join(', ')};
`;
```

### Tailwind CSS との統合

`tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';
import { primitiveColors, spacing, typography, breakpoints } from '@repo/design-tokens';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cerulean: primitiveColors.cerulean,
        'brick-ember': primitiveColors.brickEmber,
        honeydew: primitiveColors.honeydew,
        'frosted-blue': primitiveColors.frostedBlue,
        'oxford-navy': primitiveColors.oxfordNavy,
      },
      spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      letterSpacing: typography.letterSpacing,
      screens: breakpoints,
    },
  },
};

export default config;
```

使用:
```tsx
<div className="bg-cerulean-500 text-white p-4 rounded-lg">
  <h1 className="text-2xl font-bold">Hello World</h1>
</div>
```

## 型定義

すべてのトークンは厳密に型付けされています:

```typescript
import type {
  ColorScale,
  OklchColor,
  PrimitiveColorName,
  FontSizeScale,
  SpacingScale,
  BreakpointName,
} from '@repo/design-tokens';

// カラースケールは 50 | 100 | ... | 950 の型
const scale: ColorScale = 500;

// OKLCHカラーは文字列リテラル型
const color: OklchColor = 'oklch(61.12% 0.086 237.74)';
```

## 個別インポート

必要なトークンのみをインポートできます:

```typescript
// メインエクスポートから全て
import { primitiveColors, typography, spacing, breakpoints } from '@repo/design-tokens';

// カテゴリー別
import { primitiveColors } from '@repo/design-tokens/colors';
import { typography } from '@repo/design-tokens/typography';
import { spacing } from '@repo/design-tokens/spacing';
import { breakpoints } from '@repo/design-tokens/breakpoints';
```

## ブラウザ対応

OKLCHカラースペースは以下のブラウザでサポートされています:

- Safari 15.4+
- Chrome 111+
- Firefox 113+

それ以前のブラウザでは polyfill または fallback が必要です。

## 将来の拡張

- **セマンティックカラー**: primary, secondary, success, warning, danger, info などのロール別カラー
- **ダークモードテーマ**: lightTheme, darkTheme
- **Mobile (React Native) 対応**: OKLCH → RGBA 変換ユーティリティ

## ライセンス

Private
