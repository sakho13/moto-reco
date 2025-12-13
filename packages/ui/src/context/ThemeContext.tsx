'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { ThemeName, themes, ThemeTokens } from '@packages/theme'

type ThemeContextValue = {
  themeName: ThemeName
  setThemeName: (themeName: ThemeName) => void
}

type ThemeProviderProps = {
  children: React.ReactNode
  initialThemeName?: ThemeName
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
  initialThemeName = 'light',
}: ThemeProviderProps) => {
  const [themeName, setThemeName] = useState<ThemeName>(initialThemeName)

  useEffect(() => {
    const theme: ThemeTokens = themes[themeName]
    const root = document.documentElement

    // colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value as string)
    })
    // spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value as string)
    })
    // fontWeights
    Object.entries(theme.fontWeights).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value as string)
    })
    // fontSize
    Object.entries(theme.fontSizes).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value as string)
    })
    // lineHeight
    Object.entries(theme.lintHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value as string)
    })
    // radius
    Object.entries(theme.radius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value as string)
    })
    // shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value as string)
    })
    // transitions
    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value as string)
    })
  }, [themeName])

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  )
}
