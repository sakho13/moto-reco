import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthProvider'

/**
 * 認証状態と、ログイン・ログアウトなどの操作を取得する
 *
 * @throws {Error} `AuthProvider` の外で呼んだ場合
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth は AuthProvider の中で使ってください')
  }
  return context
}
