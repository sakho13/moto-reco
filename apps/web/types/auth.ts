import type { User } from 'firebase/auth'
import type { SwitchableProviderId } from '@/lib/firebase/auth'

export interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<string>
  registerWithEmail: (email: string, password: string) => Promise<string>
  requestPasswordReset: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<string>
  /** ログイン中のユーザーにGoogleアカウントを紐付ける */
  linkWithGoogle: () => Promise<void>
  /** ログイン中のユーザーに現在のメールアドレスとパスワードを紐付ける */
  linkWithEmailPassword: (password: string) => Promise<void>
  /** 指定した認証方式以外の切り替え可能な認証方式を外す */
  unlinkProvidersExcept: (keepProviderId: SwitchableProviderId) => Promise<void>
  /** Firebase上のユーザー情報（紐付いている認証方式など）を再取得する */
  reloadUser: () => Promise<void>
  signOut: () => Promise<boolean>
  getIdToken: () => Promise<string | null>
  /** ゲストとして匿名ログインし、IDトークンを返す */
  signInAsGuest: () => Promise<string>
  /** 現在のユーザーがゲスト（匿名）かどうか */
  isGuest: boolean
}
