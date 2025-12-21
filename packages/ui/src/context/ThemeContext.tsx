'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  ThemeMode,
  ThemeName,
  themeModes,
  themes,
  ThemeTokens,
} from '@packages/theme'

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
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode)

  const theme: ThemeTokens = useMemo(() => {
    const selectedTheme = themes[themeName]?.[themeMode]
    if (selectedTheme) return selectedTheme
    return themes.default.light
  }, [themeMode, themeName])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedMode = window.localStorage.getItem('theme-mode')
    if (storedMode && themeModes.includes(storedMode as ThemeMode)) {
      setThemeMode(storedMode as ThemeMode)
      return
    }

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    setThemeMode(prefersDark ? 'dark' : 'light')
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

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme-mode', themeMode)
    }
  }, [themeMode, themeName, theme])

  return (
    <ThemeContext.Provider
      value={{ themeName, themeMode, setThemeName, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
