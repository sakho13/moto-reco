import { themes } from '@repo/theme'

const BASE_FONT_SIZE = 16

function remToNumber(rem: string): number {
  return parseFloat(rem) * BASE_FONT_SIZE
}

const raw = themes.default.light

export const themeTokens = {
  colors: raw.colors,
  spacing: {
    0: 0,
    1: remToNumber(raw.spacing[1]),
    2: remToNumber(raw.spacing[2]),
    3: remToNumber(raw.spacing[3]),
    4: remToNumber(raw.spacing[4]),
    5: remToNumber(raw.spacing[5]),
    6: remToNumber(raw.spacing[6]),
    8: remToNumber(raw.spacing[8]),
    10: remToNumber(raw.spacing[10]),
    12: remToNumber(raw.spacing[12]),
    16: remToNumber(raw.spacing[16]),
  },
  fontSizes: {
    xs: remToNumber(raw.fontSizes.xs),
    sm: remToNumber(raw.fontSizes.sm),
    md: remToNumber(raw.fontSizes.md),
    lg: remToNumber(raw.fontSizes.lg),
    xl: remToNumber(raw.fontSizes.xl),
    '2xl': remToNumber(raw.fontSizes['2xl']),
    '3xl': remToNumber(raw.fontSizes['3xl']),
  },
  fontWeights: raw.fontWeights,
  lineHeight: raw.lineHeight,
  radius: {
    none: 0,
    sm: remToNumber(raw.radius.sm),
    md: remToNumber(raw.radius.md),
    lg: remToNumber(raw.radius.lg),
    full: 9999,
  },
} as const
