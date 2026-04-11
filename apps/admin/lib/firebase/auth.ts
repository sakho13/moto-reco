import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type UserCredential,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from './config'

/**
 * メールアドレスとパスワードでログイン
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const auth = getFirebaseAuth()
  return await signInWithEmailAndPassword(auth, email, password)
}

/**
 * ログアウト
 */
export const signOut = async (): Promise<void> => {
  const auth = getFirebaseAuth()
  return await firebaseSignOut(auth)
}

/**
 * IDトークンの取得（API呼び出し用）
 */
export const getIdToken = async (user: User): Promise<string | null> => {
  try {
    return await user.getIdToken()
  } catch (error) {
    console.error('IDトークン取得エラー:', error)
    return null
  }
}
