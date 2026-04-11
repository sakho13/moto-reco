'use client'

import { GoogleAnalytics } from '@next/third-parties/google'

/**
 * Google Analytics統合コンポーネント
 * 環境変数の参照と条件分岐をコンポーネント内に隠蔽
 */
export function FirebaseAnalytics() {
  const isProduction = process.env.NODE_ENV === 'production'
  const gaId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

  if (!isProduction || !gaId) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
