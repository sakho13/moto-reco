import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app'
import type { Storage } from 'firebase-admin/storage'
import { getStorage } from 'firebase-admin/storage'

const globalForFirebase = global as unknown as {
  firebaseAdminStorage: Storage | undefined
}

/**
 * Firebase Admin SDK の Storage クライアントを取得
 *
 * getApp() が成功する前提（firebase-auth-server が先に初期化済み）。
 * 未初期化の場合は同じ環境変数でフォールバック初期化する。
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

  const app = getApps().length > 0 ? getApp() : initFirebaseAdminApp()
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

  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'

  if (useEmulator) {
    return initializeApp({ projectId })
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}
