import { getApps, initializeApp } from 'firebase/app'
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth'

let authInstance: ReturnType<typeof getAuth> | null = null
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'

function getFirebaseApp() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  }
  const apps = getApps()
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig)
  return app
}

export function getFirebaseClientAuth() {
  if (typeof window === 'undefined' && !useEmulator) return null

  if (authInstance) return authInstance

  const app = getFirebaseApp()
  const auth = getAuth(app)

  if (useEmulator) {
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
    })
  }
  authInstance = auth

  return authInstance
}

const AUTH_EMULATOR_URL = 'http://localhost:9099'

/**
 * Auth Emulator 上のユーザーのメールアドレスを確認済みにする
 *
 * @remarks
 * Emulator は `Authorization: Bearer owner` で管理者として accounts:update を受け付ける。
 */
export const markEmailVerifiedInEmulator = async (
  uid: string
): Promise<void> => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const res = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: uid, emailVerified: true }),
    }
  )
  if (!res.ok) {
    throw new Error(
      `メールアドレスの確認済み化に失敗しました: ${res.status} ${await res.text()}`
    )
  }
}

/**
 * Auth Emulator でメール/パスワードのユーザーを作成する
 *
 * @remarks
 * 本番ではメールアドレスの所有確認が済んだユーザーを前提とするため、既定で確認済みにする。
 * 未確認ユーザーの挙動を確かめる場合は `emailVerified: false` を指定する。
 * 確認済み化した後に ID トークンを再発行するため、以降の `getIdToken()` は確認済みのトークンを返す。
 */
export const handleRegisterByFirebase = async (
  email: string,
  password: string,
  options: { emailVerified?: boolean } = {}
) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (options.emailVerified ?? true) {
    await markEmailVerifiedInEmulator(credential.user.uid)
    await credential.user.getIdToken(true)
  }
  return credential
}

export const handleLoginByFirebase = async (
  email: string,
  password: string
) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  return await signInWithEmailAndPassword(auth, email, password)
}

export const handleAnonymousSignInByFirebase = async () => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  // 既存のセッションをクリアして必ず新しい匿名ユーザーを作成する
  if (auth.currentUser) {
    await signOut(auth)
  }
  return await signInAnonymously(auth)
}

export const handleLinkAnonymousWithEmail = async (
  email: string,
  password: string
) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  if (!auth.currentUser) throw new Error('No current user to link')
  const credential = EmailAuthProvider.credential(email, password)
  return await linkWithCredential(auth.currentUser, credential)
}

const createGoogleCredential = (email: string) =>
  GoogleAuthProvider.credential(
    JSON.stringify({
      sub: `google-${email}`,
      email,
      email_verified: true,
    })
  )

/**
 * Auth Emulator で Google アカウントとしてサインインする
 *
 * @remarks
 * Emulator は署名なしの JSON を Google の ID トークンとして受け付ける。
 * 同じメールアドレスの既存アカウントがある場合は、そのアカウント（同じUID）にサインインする。
 */
export const handleGoogleSignInByFirebase = async (email: string) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  return await signInWithCredential(auth, createGoogleCredential(email))
}

/**
 * サインイン中のユーザーに Google アカウントを紐付ける
 */
export const handleLinkGoogleToCurrentUser = async (email: string) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  if (!auth.currentUser) throw new Error('No current user to link')
  return await linkWithCredential(
    auth.currentUser,
    createGoogleCredential(email)
  )
}

/**
 * サインイン中のユーザーにパスワードを設定する
 *
 * @remarks
 * パスワード未設定のユーザーには、メールアドレスを使ったメール/パスワードの認証方式が追加される。
 */
export const handleSetPasswordToCurrentUser = async (password: string) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  if (!auth.currentUser) throw new Error('No current user to update')
  await updatePassword(auth.currentUser, password)
}
