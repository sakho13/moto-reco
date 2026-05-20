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
 * Firebase Auth Emulator でテストユーザーを新規作成し、ID トークンを返す
 *
 * @param email - テスト用メールアドレス
 * @param password - テスト用パスワード
 * @returns Firebase ID トークン
 */
export async function createTestUserAndGetToken(
  email: string,
  password: string
): Promise<string> {
  const auth = _getEmulatorAuth()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
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
