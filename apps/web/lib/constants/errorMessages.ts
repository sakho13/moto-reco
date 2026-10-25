/**
 * エラーメッセージ定数
 *
 * @remarks
 * アプリケーション全体で使用するエラーメッセージを一元管理します。
 */

/**
 * エラーメッセージの定義
 */
export const ERROR_MESSAGES = {
  // バリデーション
  VALIDATION: {
    EMAIL_REQUIRED: 'メールアドレスを入力してください',
    EMAIL_INVALID: '有効なメールアドレスを入力してください',
    PASSWORD_REQUIRED: 'パスワードを入力してください',
    PASSWORD_TOO_SHORT: 'パスワードは8文字以上である必要があります',
    PASSWORD_WEAK: 'パスワードは英字と数字を含む必要があります',
    PASSWORD_CONFIRM_REQUIRED: 'パスワード（確認）を入力してください',
    PASSWORD_MISMATCH: 'パスワードが一致しません',
    NAME_REQUIRED: 'ユーザー名を入力してください',
    NAME_TOO_LONG: 'ユーザー名は50文字以内である必要があります',
  },

  // Firebase認証
  AUTH: {
    EMAIL_ALREADY_IN_USE: 'このメールアドレスは既に使用されています',
    INVALID_EMAIL: 'メールアドレスが無効です',
    WEAK_PASSWORD:
      'パスワードが弱すぎます。より強力なパスワードを設定してください',
    USER_NOT_FOUND: 'ユーザーが見つかりません',
    WRONG_PASSWORD: 'パスワードが間違っています',
    TOO_MANY_REQUESTS:
      'リクエストが多すぎます。しばらくしてから再試行してください',
    USER_DISABLED: 'このアカウントは無効化されています',
    OPERATION_NOT_ALLOWED: 'この操作は許可されていません',
    INVALID_CREDENTIAL: '認証情報が無効です',
    POPUP_BLOCKED:
      'ポップアップがブロックされました。ブラウザの設定でポップアップを許可してから再度お試しください',
    ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL:
      'このメールアドレスは別のログイン方法で登録済みです。メールアドレスとパスワードでログインしてください',
    CREDENTIAL_ALREADY_IN_USE:
      'このGoogleアカウントは別のアカウントで使用されています。別のGoogleアカウントを選択してください',
    REQUIRES_RECENT_LOGIN:
      'セキュリティのため、一度ログアウトしてから再度ログインし、もう一度お試しください',
    PROVIDER_SWITCH_FAILED:
      'ログイン方法の切り替えに失敗しました。もう一度お試しください',
  },

  // API
  API: {
    NETWORK_ERROR:
      'ネットワークエラーが発生しました。インターネット接続を確認してください',
    SERVER_ERROR:
      'サーバーエラーが発生しました。しばらくしてから再試行してください',
    UNKNOWN_ERROR: '予期しないエラーが発生しました',
    REGISTRATION_FAILED: 'ユーザー登録に失敗しました',
  },
} as const

/**
 * Firebaseエラーコードを日本語メッセージに変換
 *
 * @param errorCode - Firebaseエラーコード
 * @returns 日本語のエラーメッセージ
 *
 * @example
 * ```ts
 * try {
 *   await signInWithEmail(email, password)
 * } catch (error) {
 *   const message = getFirebaseErrorMessage(error.code)
 *   console.error(message)
 * }
 * ```
 */
export const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return ERROR_MESSAGES.AUTH.EMAIL_ALREADY_IN_USE
    case 'auth/invalid-email':
      return ERROR_MESSAGES.AUTH.INVALID_EMAIL
    case 'auth/weak-password':
      return ERROR_MESSAGES.AUTH.WEAK_PASSWORD
    case 'auth/user-not-found':
      return ERROR_MESSAGES.AUTH.USER_NOT_FOUND
    case 'auth/wrong-password':
      return ERROR_MESSAGES.AUTH.WRONG_PASSWORD
    case 'auth/too-many-requests':
      return ERROR_MESSAGES.AUTH.TOO_MANY_REQUESTS
    case 'auth/user-disabled':
      return ERROR_MESSAGES.AUTH.USER_DISABLED
    case 'auth/operation-not-allowed':
      return ERROR_MESSAGES.AUTH.OPERATION_NOT_ALLOWED
    case 'auth/invalid-credential':
      return ERROR_MESSAGES.AUTH.INVALID_CREDENTIAL
    case 'auth/popup-blocked':
      return ERROR_MESSAGES.AUTH.POPUP_BLOCKED
    case 'auth/account-exists-with-different-credential':
      return ERROR_MESSAGES.AUTH.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL
    case 'auth/credential-already-in-use':
      return ERROR_MESSAGES.AUTH.CREDENTIAL_ALREADY_IN_USE
    case 'auth/requires-recent-login':
      return ERROR_MESSAGES.AUTH.REQUIRES_RECENT_LOGIN
    default:
      return ERROR_MESSAGES.API.UNKNOWN_ERROR
  }
}
