'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ThemeMode,
  ThemeName,
  themeModes,
  themes,
  ThemeTokens,
} from '@repo/theme'

type ThemeContextValue = {
  themeName: ThemeName
  themeMode: ThemeMode
  setThemeName: (themeName: ThemeName) => void
  setThemeMode: (themeMode: ThemeMode) => void
}

type ThemeProviderProps = {
  children: React.ReactNode
  initialThemeName?: ThemeName
  initialThemeMode?: ThemeMode
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({
  children,
  initialThemeName = 'default',
  initialThemeMode = 'light',
}: ThemeProviderProps) => {
  const [themeName, setThemeName] = useState<ThemeName>(initialThemeName)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialThemeMode)

  /** テーマモードを変更し、ユーザーの選択として localStorage に保存する */
  const setThemeMode = useCallback((nextThemeMode: ThemeMode) => {
    setThemeModeState(nextThemeMode)
    window.localStorage.setItem('theme-mode', nextThemeMode)
  }, [])

  const theme: ThemeTokens = useMemo(() => {
    const selectedTheme = themes[themeName]?.[themeMode]
    if (selectedTheme) return selectedTheme
    return themes.default.light
  }, [themeMode, themeName])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedMode = window.localStorage.getItem('theme-mode')
    if (storedMode && themeModes.includes(storedMode as ThemeMode)) {
      setThemeModeState(storedMode as ThemeMode)
      return
    }

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    setThemeModeState(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    const root = document.documentElement

    // colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, String(value))
    })
    // spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, String(value))
    })
    // fontFamilies
    Object.entries(theme.fontFamilies).forEach(([key, value]) => {
      root.style.setProperty(`--font-family-${key}`, String(value))
    })
    // fontWeights
    Object.entries(theme.fontWeights).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, String(value))
    })
    // fontSize
    Object.entries(theme.fontSizes).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, String(value))
    })
    // lineHeight
    Object.entries(theme.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, String(value))
    })
    // radius
    Object.entries(theme.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, String(value))
    })
    // shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, String(value))
    })
    // transitions
    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, String(value))
    })

    root.dataset.themeName = themeName
    root.dataset.themeMode = themeMode
    root.style.colorScheme = themeMode
  }, [themeMode, themeName, theme])

  return (
    <ThemeContext.Provider
      value={{ themeName, themeMode, setThemeName, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
