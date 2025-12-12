import { ThemeTokens } from './type'

export const lightThemes = ['light'] as const

export const darkThemes = [
  // 'dark'
] as const

type ThemeName = (typeof lightThemes)[number] | (typeof darkThemes)[number]

export const themes: Record<ThemeName, ThemeTokens> = {
  light: {
    colors: {
      background: '#FFFFFF',
      cloud: '#F7F7F7',
      cloudHover: '#E1E1E1',

      product: '#0070F3',
      productHover: '#005FCC',
      productActive: '#004299',

      success: '#3bceac',
      danger: '#CC0000',
      warning: '#FFD166',
      social: '#1D3557',

      ink: '#324256',
      inkLight: '#4E5C6F',
      inkDark: '#0B0C0F',
    },
    fontSizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
    },
    radius: {
      sm: '4px',
      md: '8px',
      lg: '16px',
    },
    shadows: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      lg: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    },
  },
}
