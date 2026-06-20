import type { Auth } from 'firebase-admin/auth'
import { getAuth } from 'firebase-admin/auth'
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'

// グローバルシングルトンキャッシュ
const globalForFirebase = global as unknown as {
  firebaseAuth: Auth | undefined
}

/**
 * Firebase Admin SDKのAuthクライアントを取得
 *
 * 遅延初期化パターンを採用し、初回呼び出し時にのみ初期化を実行します。
 * グローバルキャッシュを使用してシングルトンインスタンスを保証します。
 *
 * 必須な環境変数:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * - NEXT_PUBLIC_USE_FIREBASE_EMULATOR (エミュレータ使用時に'true'に設定)
 *
 * @throws {Error} 環境変数が未設定の場合
 * @returns {Auth} Firebase Admin Auth クライアント
 */
export function getFirebaseAdminAuthClient(): Auth {
  // キャッシュが存在する場合はそれを返す
  if (globalForFirebase.firebaseAuth) {
    return globalForFirebase.firebaseAuth
  }

  // 初回呼び出し時: Firebaseアプリを初期化してAuthクライアントを取得
  const auth = getAuth(getFirebaseApp())

  // 開発環境ではグローバルにキャッシュ (HMR対応)
  if (process.env.NODE_ENV !== 'production') {
    globalForFirebase.firebaseAuth = auth
  }

  return auth
}

function getFirebaseApp() {
  const options = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
  if (!options.projectId || !options.clientEmail || !options.privateKey) {
    throw new Error('🐛 API Firebase設定パラメータが未設定')
  }

  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
  if (useEmulator) {
    console.warn('⚠️ Firebase Auth Emulatorを使用しています')
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
    process.env.GCLOUD_PROJECT = options.projectId
  }

  if (!getApps().length) {
    const projectId = options.projectId
    if (useEmulator) {
      initializeApp({
        projectId,
      })
    } else {
      const pk = options.privateKey
      initializeApp({
        credential: cert({
          projectId,
          clientEmail: options.clientEmail,
          privateKey: pk,
        }),
      })
    }
  }
  return getApp()
}
