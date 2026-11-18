import { useColorScheme } from 'react-native'
import { APP_THEMES, type AppTheme } from './tokens'

/**
 * 端末の外観モード（ライト／ダーク）に合わせたテーマを返す
 */
export function useAppTheme(): AppTheme {
  const scheme = useColorScheme()
  return APP_THEMES[scheme === 'dark' ? 'dark' : 'light']
}
