import type { User } from 'firebase/auth'

export interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<string>
  registerWithEmail: (email: string, password: string) => Promise<string>
  requestPasswordReset: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<string>
  signOut: () => Promise<boolean>
  getIdToken: () => Promise<string | null>
  /** ゲストとして匿名ログインし、IDトークンを返す */
  signInAsGuest: () => Promise<string>
  /** 現在のユーザーがゲスト（匿名）かどうか */
  isGuest: boolean
}
