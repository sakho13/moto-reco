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
    default:
      return ERROR_MESSAGES.API.UNKNOWN_ERROR
  }
}
