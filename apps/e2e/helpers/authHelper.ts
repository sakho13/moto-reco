import { getApps, initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth'

const FIREBASE_AUTH_EMULATOR_URL =
  process.env['FIREBASE_AUTH_EMULATOR_URL'] ?? 'http://localhost:9099'

let _authInstance: ReturnType<typeof getAuth> | null = null

/**
 * Firebase Auth Emulator に接続した auth インスタンスを返す
 */
function _getEmulatorAuth(): ReturnType<typeof getAuth> {
  if (_authInstance) return _authInstance

  const firebaseConfig = {
    apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] ?? 'test-api-key',
    authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] ?? 'localhost',
    projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] ?? 'motoreco',
    storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] ?? '',
    messagingSenderId:
      process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] ?? 'test-app-id',
  }

  const apps = getApps()
  const app = apps.length > 0 ? apps[0]! : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  connectAuthEmulator(auth, FIREBASE_AUTH_EMULATOR_URL, {
    disableWarnings: true,
  })
  _authInstance = auth
  return _authInstance
}

/**
 * Firebase Auth Emulator 上のユーザーのメールアドレスを確認済みにする
 *
 * @remarks
 * Emulator は `Authorization: Bearer owner` で管理者として accounts:update を受け付ける。
 *
 * @param uid - Firebase UID
 */
export async function markEmailVerifiedInEmulator(uid: string): Promise<void> {
  const projectId = process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] ?? 'motoreco'
  const res = await fetch(
    `${FIREBASE_AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: uid, emailVerified: true }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(
      `メールアドレスの確認済み化に失敗: ${res.status} ${await res.text()}`
    )
  }
}

/**
 * Firebase Auth Emulator でテストユーザーを新規作成し、ID トークンを返す
 *
 * @remarks
 * 本番ではメールアドレスの所有確認が済んだユーザーを前提とするため、既定で確認済みにする
 * （未確認のまま登録すると通知メールアドレスが確認待ちになる）。
 * 未確認ユーザーの挙動を確かめる場合は `emailVerified: false` を指定する。
 *
 * @param email - テスト用メールアドレス
 * @param password - テスト用パスワード
 * @param options - `emailVerified`: メールアドレスを確認済みにするか（既定: true）
 * @returns Firebase ID トークン
 */
export async function createTestUserAndGetToken(
  email: string,
  password: string,
  options: { emailVerified?: boolean } = {}
): Promise<string> {
  const auth = _getEmulatorAuth()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (options.emailVerified ?? true) {
    await markEmailVerifiedInEmulator(credential.user.uid)
    // 確認済みの状態を ID トークンに反映するため再発行する
    return credential.user.getIdToken(true)
  }
  return credential.user.getIdToken()
}

/**
 * Firebase Auth Emulator でサインインし、ID トークンを返す
 *
 * @param email - メールアドレス
 * @param password - パスワード
 * @returns Firebase ID トークン
 */
export async function signInTestUser(
  email: string,
  password: string
): Promise<string> {
  const auth = _getEmulatorAuth()
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user.getIdToken()
}
