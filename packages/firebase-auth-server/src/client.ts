import { getAuth } from 'firebase-admin/auth'
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'

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

/**
 * Firebase Admin SDKのAuthクライアント
 *
 * 必須な環境変数:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * - NEXT_PUBLIC_USE_FIREBASE_EMULATOR (エミュレータ使用時に'true'に設定)
 */
export const firebaseAdminAuthClient = getAuth(getFirebaseApp())
