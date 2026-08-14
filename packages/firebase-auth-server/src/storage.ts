import { getApps, initializeApp, cert } from 'firebase-admin/app'
import type { Storage } from 'firebase-admin/storage'
import { getStorage } from 'firebase-admin/storage'

const globalForFirebase = global as unknown as {
  firebaseAdminStorage: Storage | undefined
}

/**
 * Storage専用のFirebaseアプリ名。
 *
 * 署名付きURL生成(V4署名)はローカル完結の暗号処理でエミュレータ経由でも
 * 実在するサービスアカウント形式の秘密鍵が必須なため、firebase-auth-server
 * が初期化する認証情報なしのデフォルトアプリとは別に、常にcert認証情報を
 * 持つ専用アプリを用意する。
 */
const STORAGE_APP_NAME = 'storage'

/**
 * Firebase Admin SDK の Storage クライアントを取得
 *
 * 必須環境変数:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 */
export function getFirebaseAdminStorage(): Storage {
  if (globalForFirebase.firebaseAdminStorage) {
    return globalForFirebase.firebaseAdminStorage
  }

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199'
  }

  const existingApp = getApps().find((a) => a.name === STORAGE_APP_NAME)
  const app = existingApp ?? initFirebaseAdminApp()
  const storage = getStorage(app)

  if (process.env.NODE_ENV !== 'production') {
    globalForFirebase.firebaseAdminStorage = storage
  }

  return storage
}

export function getStorageBucketName(): string {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!bucket) {
    throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET が未設定')
  }
  return bucket
}

function initFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin 設定パラメータが未設定')
  }

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    STORAGE_APP_NAME
  )
}
