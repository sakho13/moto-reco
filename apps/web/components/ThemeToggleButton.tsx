'use client'

import { Button } from '@repo/ui/button'
import { useTheme } from '@repo/ui/context/ThemeContext'

type Props = {
  /** true のときは文言を出さず、アイコンだけを表示する */
  iconOnly?: boolean
}

export function ThemeToggleButton({ iconOnly = false }: Props) {
  const { themeMode, setThemeMode } = useTheme()
  const isDark = themeMode === 'dark'

  const handleToggle = () => {
    setThemeMode(isDark ? 'light' : 'dark')
  }

  return (
    <Button
      type="button"
      variant="cloud"
      size="sm"
      aria-pressed={isDark}
      aria-label={`テーマを${isDark ? 'ライト' : 'ダーク'}モードに切り替える`}
      onClick={handleToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
      {!iconOnly && <span>{isDark ? 'ダーク' : 'ライト'}</span>}
    </Button>
  )
}
