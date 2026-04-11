import type { User } from 'firebase/auth'

export type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<string>
  signOut: () => Promise<boolean>
  getIdToken: () => Promise<string | null>
}
