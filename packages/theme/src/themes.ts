import { ThemeTokens } from './type'

export const themeNames = ['default'] as const

export const themeModes = ['light', 'dark'] as const

export type ThemeName = (typeof themeNames)[number]

export type ThemeMode = (typeof themeModes)[number]

const defaultLightTheme: ThemeTokens = {
  colors: {
    background: '#FFFFFF',
    cloud: '#F7F7F7',
    cloudHover: '#E1E1E1',
    cloudActive: '#CFCFCF',

    product: '#0070F3',
    productHover: '#005FCC',
    productActive: '#004299',

    success: '#3bceac',
    successHover: '#32b89c',
    successActive: '#279f85',

    danger: '#CC0000',
    dangerHover: '#AA0000',
    dangerActive: '#880000',

    warning: '#FFD166',
    warningHover: '#E6B800',
    warningActive: '#CC9900',

    social: '#3B5998',
    socialHover: '#2D4373',
    socialActive: '#1A2A4A',

    ink: '#324256',
    inkLight: '#4E5C6F',
    inkDark: '#0B0C0F',
  },
  spacing: {
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
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeights: {
    thin: 100,
    normal: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

const defaultDarkTheme: ThemeTokens = {
  colors: {
    background: '#0F172A',
    cloud: '#676767',
    cloudHover: '#818181',
    cloudActive: '#4b4b4b',

    product: '#38BDF8',
    productHover: '#0EA5E9',
    productActive: '#0284C7',

    success: '#34D399',
    successHover: '#22C55E',
    successActive: '#16A34A',

    danger: '#F87171',
    dangerHover: '#EF4444',
    dangerActive: '#DC2626',

    warning: '#FBBF24',
    warningHover: '#F59E0B',
    warningActive: '#D97706',

    social: '#8B9DC3',
    socialHover: '#7A8CB0',
    socialActive: '#6A7B9D',

    ink: '#E2E8F0',
    inkLight: '#94A3B8',
    inkDark: '#F8FAFC',
  },
  spacing: {
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
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeights: {
    thin: 100,
    normal: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.35)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.35)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.55), 0 6px 6px rgba(0, 0, 0, 0.45)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export const themes: Record<ThemeName, Record<ThemeMode, ThemeTokens>> = {
  default: {
    light: defaultLightTheme,
    dark: defaultDarkTheme,
  },
}
