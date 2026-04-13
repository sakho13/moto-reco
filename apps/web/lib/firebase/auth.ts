import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
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
 * メールアドレスとパスワードで新規登録
 */
export const registerWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const auth = getFirebaseAuth()
  return await createUserWithEmailAndPassword(auth, email, password)
}

/**
 * メールアドレス宛にパスワード再設定メールを送信
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const auth = getFirebaseAuth()
  await sendPasswordResetEmail(auth, email)
}

/**
 * Googleアカウントでログイン
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile')
  return await signInWithPopup(auth, provider)
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

/**
 * 匿名ユーザーとしてサインイン（ゲストモード）
 */
export const signInAnonymously = async (): Promise<UserCredential> => {
  const auth = getFirebaseAuth()
  return await firebaseSignInAnonymously(auth)
}

/**
 * 匿名アカウントをGoogleアカウントに連携（ゲスト→本登録）
 */
export const linkAnonymousWithGoogle = async (): Promise<UserCredential> => {
  const auth = getFirebaseAuth()
  if (!auth.currentUser) {
    throw new Error('ログインユーザーが存在しません')
  }
  const provider = new GoogleAuthProvider()
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile')
  return await linkWithPopup(auth.currentUser, provider)
}

/**
 * 匿名アカウントをメール/パスワードアカウントに連携（ゲスト→本登録）
 */
export const linkAnonymousWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const auth = getFirebaseAuth()
  if (!auth.currentUser) {
    throw new Error('ログインユーザーが存在しません')
  }
  const credential = EmailAuthProvider.credential(email, password)
  return await linkWithCredential(auth.currentUser, credential)
}
