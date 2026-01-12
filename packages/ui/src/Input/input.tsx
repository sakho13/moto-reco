'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import styles from './input.module.css'

/**
 * Inputコンポーネントのプロパティ
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * エラー状態
   * @default false
   */
  error?: boolean
  /**
   * ヘルパーテキスト（入力欄の下に表示される説明文）
   */
  helperText?: string
}

/**
 * Inputコンポーネント
 *
 * @remarks
 * デザイントークンを使用したスタイリングを適用した入力フィールドコンポーネント。
 * エラー状態、ヘルパーテキストをサポート。
 *
 * @example
 * ```tsx
 * <Input
 *   type="email"
 *   placeholder="メールアドレス"
 *   error={!!emailError}
 *   helperText="有効なメールアドレスを入力してください"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, helperText, className, ...props }, ref) => {
    const inputClasses = [styles.input, error && styles.error, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={styles.container}>
        <input
          ref={ref}
          className={inputClasses}
          aria-invalid={error}
          {...props}
        />
        {helperText && (
          <p
            className={`${styles.helperText} ${error ? styles.helperError : ''}`}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
