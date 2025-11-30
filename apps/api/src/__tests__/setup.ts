// 環境変数設定（Firebaseエミュレータを使用）
process.env.NODE_ENV = 'test'
process.env.USE_FIREBASE_EMULATOR = 'true'

// Firebaseエミュレータのプロジェクトと、アプリケーションのプロジェクトを一致させる
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'motorepo'
process.env.FIREBASE_PROJECT_ID = firebaseProjectId
process.env.GCLOUD_PROJECT = firebaseProjectId

process.env.FIREBASE_CLIENT_EMAIL =
  process.env.FIREBASE_CLIENT_EMAIL || 'test@test.com'
process.env.FIREBASE_PRIVATE_KEY =
  process.env.FIREBASE_PRIVATE_KEY ||
  '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'

// DATABASE_URLは既存の環境変数を使用（.envから読み込まれる想定）
