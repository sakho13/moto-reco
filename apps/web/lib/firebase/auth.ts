import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithPopup,
  reauthenticateWithCredential,
  unlink,
  updatePassword,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
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
 * ログイン中のユーザーにGoogleアカウントを紐付ける
 */
export const linkWithGoogle = async (): Promise<UserCredential> => {
  const auth = getFirebaseAuth()
  if (!auth.currentUser) {
    throw new Error('認証されていません')
  }
  const provider = new GoogleAuthProvider()
  return await linkWithPopup(auth.currentUser, provider)
}

/**
 * ログイン中のユーザーにパスワードを設定し、現在のメールアドレスとパスワードでログインできるようにする
 */
export const linkWithEmailPassword = async (
  password: string
): Promise<void> => {
  const auth = getFirebaseAuth()
  const currentUser = auth.currentUser
  if (!currentUser?.email) {
    throw new Error('認証されていません')
  }
  await updatePassword(currentUser, password)
  await reauthenticateWithCredential(
    currentUser,
    EmailAuthProvider.credential(currentUser.email, password)
  )
}

/** ログイン方法として切り替え可能な Firebase の認証方式ID */
export type SwitchableProviderId = 'password' | 'google.com'

const isSwitchableProviderId = (id: string): id is SwitchableProviderId =>
  id === 'password' || id === 'google.com'

/**
 * ログイン中のユーザーから、指定した認証方式以外の切り替え可能な認証方式を外す
 *
 * @remarks
 * 外せなかった認証方式はサーバーの切り替えAPIが外すため、失敗しても例外を投げない。
 *
 * @param keepProviderId - 残す認証方式
 */
export const unlinkProvidersExcept = async (
  keepProviderId: SwitchableProviderId
): Promise<void> => {
  const currentUser = getFirebaseAuth().currentUser
  if (!currentUser) return

  const providerIdsToUnlink = currentUser.providerData
    .map((p) => p.providerId)
    .filter(isSwitchableProviderId)
    .filter((id) => id !== keepProviderId)

  for (const providerId of providerIdsToUnlink) {
    try {
      await unlink(currentUser, providerId)
    } catch (error: unknown) {
      console.error('Provider unlink error:', error)
    }
  }
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
