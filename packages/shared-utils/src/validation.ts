/**
 * バリデーションヘルパー関数
 *
 * @remarks
 * フォームのバリデーション機能を提供します。
 * エラーがある場合はエラーメッセージを返し、問題がない場合はnullを返します。
 */

/**
 * メールアドレスのバリデーション
 *
 * @param email - 検証するメールアドレス
 * @returns エラーメッセージ（問題がない場合はnull）
 *
 * @example
 * ```ts
 * const error = validateEmail('test@example.com')
 * if (error) {
 *   console.error(error)
 * }
 * ```
 */
export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) {
    return 'メールアドレスを入力してください'
  }

  // 基本的なメールアドレス形式の検証
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '有効なメールアドレスを入力してください'
  }

  return null
}

/**
 * パスワードのバリデーション
 *
 * @param password - 検証するパスワード
 * @returns エラーメッセージ（問題がない場合はnull）
 *
 * @example
 * ```ts
 * const error = validatePassword('Password123')
 * if (error) {
 *   console.error(error)
 * }
 * ```
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'パスワードを入力してください'
  }

  if (password.length < 8) {
    return 'パスワードは8文字以上である必要があります'
  }

  // 英字と数字を含むことを確認
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasLetter || !hasNumber) {
    return 'パスワードは英字と数字を含む必要があります'
  }

  return null
}

/**
 * パスワード確認のバリデーション
 *
 * @param password - 元のパスワード
 * @param confirmPassword - 確認用パスワード
 * @returns エラーメッセージ（問題がない場合はnull）
 *
 * @example
 * ```ts
 * const error = validatePasswordMatch('Password123', 'Password123')
 * if (error) {
 *   console.error(error)
 * }
 * ```
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return 'パスワード（確認）を入力してください'
  }

  if (password !== confirmPassword) {
    return 'パスワードが一致しません'
  }

  return null
}

/**
 * ユーザー名のバリデーション
 *
 * @param name - 検証するユーザー名
 * @returns エラーメッセージ（問題がない場合はnull）
 *
 * @example
 * ```ts
 * const error = validateName('太郎')
 * if (error) {
 *   console.error(error)
 * }
 * ```
 */
export const validateName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return 'ユーザー名を入力してください'
  }

  const trimmedName = name.trim()

  if (trimmedName.length > 50) {
    return 'ユーザー名は50文字以内である必要があります'
  }

  return null
}
